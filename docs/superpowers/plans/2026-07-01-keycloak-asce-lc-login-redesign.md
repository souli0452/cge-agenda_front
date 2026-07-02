# ASCE-LC Keycloak Login Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragile CSS-hack-based ASCE-LC Keycloak login theme with a real `template.ftl`/`login.ftl` override that renders a framed two-column card (brand panel + form), fixes the broken/missing branding text and the double-box input bug, and gives the panel a magnifying-glass watermark + gold star inspired by the ASCE-LC logo.

**Architecture:** Three files change inside the Keycloak distro's `themes/asce-lc/login/` theme directory: a new `template.ftl` (base `keycloak.v2` layout macro + a real `<aside>` branding panel), a new `login.ftl` (base login form + `required=true` asterisks + a real title/subtitle heading), and a full rewrite of `resources/css/login.css` (real flex layout instead of `position: fixed` tricks, watermark/star motifs, and a fix that neutralizes the PatternFly `.pf-v5-c-form-control` wrapper span instead of styling the raw `<input>` while leaving a visible outer box). `messages/messages_fr.properties` gets two small key changes to support the new heading.

**Tech Stack:** Keycloak 26.4.7 (`keycloak.v2` base login theme), FreeMarker templates, plain CSS (no build step — files are read directly by the running server).

## Global Constraints

- Theme directory: `C:\Users\siakour.drabo\Desktop\key\keycloak-26.4.7\keycloak-26.4.7\themes\asce-lc\login\` — this directory is **not a git repository** (verified: `git rev-parse --is-inside-work-tree` fails there). Skip `git add`/`git commit` steps for files under this path; each task's last step is a manual verification instead of a commit.
- The Keycloak distro already has `spi-theme-cache-themes=false`, `spi-theme-cache-templates=false`, `spi-theme-static-max-age=-1` set in `conf/keycloak.conf` — templates and CSS hot-reload on every request. No server restart is needed between edits, only a browser refresh (or `curl` re-fetch).
- Realm under test: `asce-lc-realm` (matches `src/environments/environments.ts` in the front-end repo). **Manual browser preview URL:** `http://localhost:8080/realms/asce-lc-realm/account/` — a real browser runs the Account Console's JS, which redirects to the themed login page correctly. **`curl`/automated preview does NOT work with that URL** — it returns the Account Console's React SPA loader shell (`<title>Account Management</title>`, `data-page-id="account"`), not the login form, because curl never executes the JS redirect. For any `curl`-based check, hit the authorization endpoint directly with a PKCE challenge (the `account-console` client requires PKCE S256):
  ```bash
  CHALLENGE=$(printf '%s' "verifier1234567890verifier1234567890verifier12" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=')
  curl -s "http://localhost:8080/realms/asce-lc-realm/protocol/openid-connect/auth?client_id=account-console&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fasce-lc-realm%2Faccount%2F&response_type=code&scope=openid&code_challenge_method=S256&code_challenge=$CHALLENGE" -o /tmp/login-check.html -w "%{http_code}\n"
  ```
  This returns `200` directly (no `-L` needed) with the real `login.ftl` output in `/tmp/login-check.html`. The verifier string is never used to complete the flow (we only inspect the rendered page), so it can be reused verbatim across checks.
- Base theme reference: `keycloak.v2` (bundled in `lib/lib/main/org.keycloak.keycloak-themes-26.4.7.jar`, under `theme/keycloak.v2/login/`). Relevant property values already confirmed from that theme's `theme.properties`: `kcInputClass=pf-v5-c-form-control` (the wrapper `<span>` around every `<input>`), `kcLoginContainer=pf-v5-c-login__container`, `kcLoginMain=pf-v5-c-login__main`, `kcLoginMainBody=pf-v5-c-login__main-body`, `kcInputRequiredClass=pf-v5-c-form__label-required`, `kcFormLabelTextClass=pf-v5-c-form__label-text`, `kcButtonPrimaryClass=pf-v5-c-button pf-m-primary`, `kcCheckboxLabelClass=pf-v5-c-check__label`, `kcInputHelperTextClass=pf-v5-c-helper-text pf-v5-u-display-flex pf-v5-u-justify-content-space-between` (already a flex row — do not redeclare `display`/`justify-content` on it).
- Root cause confirmed for the two bugs from the spec: (1) the old CSS injected the tagline/features text via `#kc-form-buttons::before/::after`, but `login.ftl` in Keycloak 26.4.7 never renders an element with `id="kc-form-buttons"` (that id only exists in `register.ftl`/`login-reset-password.ftl`) — the content silently never appeared. (2) the old CSS styled the raw `<input>` but never neutralized its parent `<span class="pf-v5-c-form-control">`, which kept PatternFly's own default box/border, producing a visible "box inside a box" with a competing focus outline. Both are fixed by this plan: real DOM content in `template.ftl`, and neutralizing `.pf-v5-c-form-control` in the CSS rewrite.
- Do not modify `field.ftl`, `buttons.ftl`, or any other shared macro file — they're imported by every auth screen (register, reset password, OTP, etc.) and changing them would violate the spec's "hors périmètre" constraint. Placeholders on inputs are dropped from scope for the same reason (adding them requires threading a new param through `field.ftl`); the label above each field already conveys the same information.
- Do not touch `theme.properties` or `resources/img/logo.png`.

---

### Task 1: Start the local Keycloak dev server and confirm the baseline page loads

**Files:** none (environment setup only)

**Interfaces:** none — this task just establishes that the server is up before any edits.

- [x] **Step 1: Check whether Keycloak is already running** — DONE (already running, confirmed by the plan author before dispatch).

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/realms/asce-lc-realm/account/
```

Expected: `200`. If you get `200`, skip to Step 3.

- [ ] **Step 2: Start the server if it's not running**

```bash
cd "/c/Users/siakour.drabo/Desktop/key/keycloak-26.4.7/keycloak-26.4.7"
./bin/kc.bat start-dev
```

Run this in the background (long-lived process). Wait for a line like `Listening on: http://0.0.0.0:8080` in its output before continuing.

- [x] **Step 3: Confirm the current (pre-change) login page renders** — DONE, verified by the plan author:

```bash
CHALLENGE=$(printf '%s' "verifier1234567890verifier1234567890verifier12" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=')
curl -s "http://localhost:8080/realms/asce-lc-realm/protocol/openid-connect/auth?client_id=account-console&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fasce-lc-realm%2Faccount%2F&response_type=code&scope=openid&code_challenge_method=S256&code_challenge=$CHALLENGE" -o /tmp/login-check.html -w "%{http_code}\n"
grep -o 'id="kc-login"' /tmp/login-check.html
```

Result: `200`, `id="kc-login"` present once. Confirmed the realm is wired to the `asce-lc` theme and the login form rendered before any edits (title was `Se connecter à asce-lc-realm`, `id="username"`/`id="password"` present).

---

### Task 2: Add the branding panel via a custom `template.ftl`

**Files:**
- Create: `themes/asce-lc/login/template.ftl`

**Interfaces:**
- Produces: a real DOM `<aside class="asce-brand-panel">` as the first child of `.pf-v5-c-login__container`, containing `.asce-brand-top > img.asce-brand-logo`, `.asce-brand-mid > span.asce-brand-star + p.asce-brand-tagline + p.asce-brand-features`, and `p.asce-brand-copyright`. Task 4's CSS targets these exact class names.

- [ ] **Step 1: Write the file**

This is the base `keycloak.v2` `template.ftl` (extracted from `lib/lib/main/org.keycloak.keycloak-themes-26.4.7.jar`, path `theme/keycloak.v2/login/template.ftl`) with one addition: the `<aside class="asce-brand-panel">` block inserted as the first child of `.pf-v5-c-login__container`, right before `<header id="kc-header" ...>`.

```freemarker
<#import "field.ftl" as field>
<#import "footer.ftl" as loginFooter>
<#macro username>
  <#assign label>
    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
  </#assign>
  <@field.group name="username" label=label>
    <div class="${properties.kcInputGroup}">
      <div class="${properties.kcInputGroupItemClass} ${properties.kcFill}">
        <span class="${properties.kcInputClass} ${properties.kcFormReadOnlyClass}">
          <input id="kc-attempted-username" value="${auth.attemptedUsername}" readonly>
        </span>
      </div>
      <div class="${properties.kcInputGroupItemClass}">
        <button id="reset-login" class="${properties.kcFormPasswordVisibilityButtonClass} kc-login-tooltip" type="button" 
              aria-label="${msg('restartLoginTooltip')}" onclick="location.href='${url.loginRestartFlowUrl}'">
            <i class="fa-sync-alt fas" aria-hidden="true"></i>
            <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
        </button>
      </div>
    </div>
  </@field.group>
</#macro>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="${lang}"<#if realm.internationalizationEnabled> dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light${darkMode?then(' dark', '')}">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <script type="importmap">
        {
            "imports": {
                "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"
            }
        }
    </script>
    <#if darkMode>
      <script type="module" async blocking="render">
          const DARK_MODE_CLASS = "${properties.kcDarkModeClass}";
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

          updateDarkMode(mediaQuery.matches);
          mediaQuery.addEventListener("change", (event) => updateDarkMode(event.matches));

          function updateDarkMode(isEnabled) {
            const { classList } = document.documentElement;

            if (isEnabled) {
              classList.add(DARK_MODE_CLASS);
            } else {
              classList.remove(DARK_MODE_CLASS);
            }
          }
      </script>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    <script type="module">
        import { startSessionPolling } from "${url.resourcesPath}/js/authChecker.js";

        startSessionPolling(
            "${url.ssoLoginInOtherTabsUrl?no_esc}"
        );
    </script>
    <script type="module">
        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[data-once-link]");

            if (!link) {
                return;
            }

            if (link.getAttribute("aria-disabled") === "true") {
                event.preventDefault();
                return;
            }

            const { disabledClass } = link.dataset;

            if (disabledClass) {
                link.classList.add(...disabledClass.trim().split(/\s+/));
            }

            link.setAttribute("role", "link");
            link.setAttribute("aria-disabled", "true");
        });
    </script>
    <#if authenticationSession??>
        <script type="module">
            import { checkAuthSession } from "${url.resourcesPath}/js/authChecker.js";

            checkAuthSession(
                "${authenticationSession.authSessionIdHash}"
            );
        </script>
    </#if>
    <script>
      // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1404468
      const isFirefox = true;
    </script>
</head>

<body id="keycloak-bg" class="${properties.kcBodyClass!}" data-page-id="login-${pageId}">
<div class="${properties.kcLogin!}">
  <div class="${properties.kcLoginContainer!}">
    <aside class="asce-brand-panel" aria-hidden="true">
      <div class="asce-brand-top">
        <img class="asce-brand-logo" src="${url.resourcesPath}/img/logo.png" alt="" />
      </div>
      <div class="asce-brand-mid">
        <span class="asce-brand-star"></span>
        <p class="asce-brand-tagline">Gérez votre agenda institutionnel depuis un seul endroit.</p>
        <p class="asce-brand-features">Événements&nbsp;&middot;&nbsp;Participants&nbsp;&middot;&nbsp;Documents&nbsp;&middot;&nbsp;Statistiques</p>
      </div>
      <p class="asce-brand-copyright">&copy; 2026 ASCE-LC &mdash; CGE Agenda</p>
    </aside>
    <header id="kc-header" class="pf-v5-c-login__header">
      <div id="kc-header-wrapper"
              class="pf-v5-c-brand">${kcSanitize(msg("loginTitleHtml",(realm.displayNameHtml!'')))?no_esc}</div>
    </header>
    <main class="${properties.kcLoginMain!}">
      <div class="${properties.kcLoginMainHeader!}">
        <h1 class="${properties.kcLoginMainTitle!}" id="kc-page-title"><#nested "header"></h1>
        <#if realm.internationalizationEnabled  && locale.supported?size gt 1>
        <div class="${properties.kcLoginMainHeaderUtilities!}">
          <div class="${properties.kcInputClass!}">
            <select
              aria-label="${msg("languages")}"
              id="login-select-toggle"
              onchange="if (this.value) window.location.href=this.value"
            >
              <#list locale.supported?sort_by("label") as l>
                <option
                  value="${l.url}"
                  ${(l.languageTag == locale.currentLanguageTag)?then('selected','')}
                >
                  ${l.label}
                </option>
              </#list>
            </select>
            <span class="${properties.kcFormControlUtilClass}">
              <span class="${properties.kcFormControlToggleIcon!}">
                <svg
                  class="pf-v5-svg"
                  viewBox="0 0 320 512"
                  fill="currentColor"
                  aria-hidden="true"
                  role="img"
                  width="1em"
                  height="1em"
                >
                  <path
                    d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"
                  >
                  </path>
                </svg>
              </span>
            </span>
          </div>
        </div>
        </#if>
      </div>
      <div class="${properties.kcLoginMainBody!}">
        <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
            <#if displayRequiredFields>
                <div class="${properties.kcContentWrapperClass!}">
                    <div class="${properties.kcLabelWrapperClass!} subtitle">
                        <span class="${properties.kcInputHelperTextItemTextClass!}">
                          <span class="${properties.kcInputRequiredClass!}">*</span> ${msg("requiredFields")}
                        </span>
                    </div>
                </div>
            </#if>
        <#else>
            <#if displayRequiredFields>
                <div class="${properties.kcContentWrapperClass!}">
                    <div class="${properties.kcLabelWrapperClass!} subtitle">
                        <span class="${properties.kcInputHelperTextItemTextClass!}">
                          <span class="${properties.kcInputRequiredClass!}">*</span> ${msg("requiredFields")}
                        </span>
                    </div>
                    <div class="${properties.kcFormClass} ${properties.kcContentWrapperClass}">
                        <#nested "show-username">
                        <@username />
                    </div>
                </div>
            <#else>
                <div class="${properties.kcFormClass} ${properties.kcContentWrapperClass}">
                  <#nested "show-username">
                  <@username />
                </div>
            </#if>
        </#if>

        <#-- App-initiated actions should not see warning messages about the need to complete the action -->
        <#-- during login.                                                                               -->
        <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
            <div class="${properties.kcAlertClass!} pf-m-${(message.type = 'error')?then('danger', message.type)}">
                <div class="${properties.kcAlertIconClass!}">
                    <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                    <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                    <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                    <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                </div>
                <span class="${properties.kcAlertTitleClass!} kc-feedback-text">${kcSanitize(message.summary)?no_esc}</span>
            </div>
        </#if>

        <#nested "form">

        <#if auth?has_content && auth.showTryAnotherWayLink()>
          <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post" novalidate="novalidate">
              <input type="hidden" name="tryAnotherWay" value="on"/>
              <a id="try-another-way" href="javascript:document.forms['kc-select-try-another-way-form'].requestSubmit()"
                  class="${properties.kcButtonSecondaryClass} ${properties.kcButtonBlockClass} ${properties.kcMarginTopClass}">
                    ${kcSanitize(msg("doTryAnotherWay"))?no_esc}
              </a>
          </form>
        </#if>

          <div class="${properties.kcLoginMainFooter!}">
              <#nested "socialProviders">

              <#if displayInfo>
                  <div id="kc-info" class="${properties.kcLoginMainFooterBand!} ${properties.kcFormClass}">
                      <div id="kc-info-wrapper" class="${properties.kcLoginMainFooterBandItem!}">
                          <#nested "info">
                      </div>
                  </div>
              </#if>
          </div>
      </div>

        <div class="${properties.kcLoginMainFooter!}">
            <@loginFooter.content/>
        </div>
    </main>
  </div>
</div>
</body>
</html>
</#macro>
```

- [ ] **Step 2: Verify FreeMarker parses the file without error**

```bash
CHALLENGE=$(printf '%s' "verifier1234567890verifier1234567890verifier12" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=')
curl -s "http://localhost:8080/realms/asce-lc-realm/protocol/openid-connect/auth?client_id=account-console&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fasce-lc-realm%2Faccount%2F&response_type=code&scope=openid&code_challenge_method=S256&code_challenge=$CHALLENGE" -o /tmp/login-check.html -w "%{http_code}\n"
```

Expected: `200` (a `500` here means a FreeMarker syntax error — check the Keycloak server log output for a `FreeMarkerException` and fix the template before continuing). Do not use `curl http://localhost:8080/realms/asce-lc-realm/account/` alone — that URL returns the Account Console's React SPA shell, not the login form, because curl doesn't run the JS redirect (see Global Constraints).

- [ ] **Step 3: Verify the new markup is present**

```bash
grep -o 'class="asce-brand-panel"' /tmp/login-check.html
grep -o 'asce-brand-tagline' /tmp/login-check.html
```

Expected: both `grep` calls print a match. This confirms the tagline is now real DOM content (no longer dependent on the nonexistent `#kc-form-buttons`).

---

### Task 3: Add the real title/subtitle heading and required-field asterisks via `login.ftl`

**Files:**
- Create: `themes/asce-lc/login/login.ftl`
- Modify: `themes/asce-lc/login/messages/messages_fr.properties`

**Interfaces:**
- Consumes: nothing new from Task 2.
- Produces: `.asce-login-heading > h2.asce-login-title + p.asce-login-subtitle` inside the form section, and `required=true` on the username/password field groups (renders `.pf-v5-c-form__label-required` — already a real property name confirmed in Global Constraints). Task 4's CSS targets these class names.

- [ ] **Step 1: Update `messages/messages_fr.properties`**

Replace the file's full content with:

```properties
doLogIn=Se connecter
username=Identifiant ou email
password=Mot de passe
rememberMe=Se souvenir de moi
forgotPassword=Mot de passe oublié ?
loginAccountTitle=Connexion
loginPageSubtitle=Bienvenue, accédez à votre espace
backToLogin=Retour à la connexion
emailInstruction=Saisissez votre email pour réinitialiser votre mot de passe.
errorTitle=Erreur de connexion
successEmailSent=Un email de réinitialisation vous a été envoyé.
invalidUserMessage=Identifiant ou mot de passe incorrect.
accountDisabledMessage=Ce compte a été désactivé.
accountTemporarilyDisabledMessage=Compte temporairement bloqué. Réessayez plus tard.
```

This renames the old `loginAccountTitle` value ("Bienvenue, accédez à votre espace") into a new `loginPageSubtitle` key, and repurposes `loginAccountTitle` to hold "Connexion" (its real header text, previously faked via CSS). The old unused `logInTitle` key (dead — never referenced, case mismatch with `loginTitle`) is removed.

- [ ] **Step 2: Write `login.ftl`**

Base `keycloak.v2` `login.ftl` (extracted from the same jar, `theme/keycloak.v2/login/login.ftl`) with: a `.asce-login-heading` block added right before `<div id="kc-form">`, and `required=true` added to both `@field.input` (username) and both `@field.password` calls.

```freemarker
<#import "template.ftl" as layout>
<#import "field.ftl" as field>
<#import "buttons.ftl" as buttons>
<#import "social-providers.ftl" as identityProviders>
<#import "passkeys.ftl" as passkeys>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
<!-- template: login.ftl -->

    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <div class="asce-login-heading">
            <h2 class="asce-login-title">${msg("loginAccountTitle")}</h2>
            <p class="asce-login-subtitle">${msg("loginPageSubtitle")}</p>
        </div>
        <div id="kc-form">
          <div id="kc-form-wrapper">
            <#if realm.password>
                <form id="kc-form-login" class="${properties.kcFormClass!}" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" novalidate="novalidate">
                    <#if !usernameHidden??>
                        <#assign label>
                            <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                        </#assign>
                        <@field.input name="username" label=label required=true error=kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc
                            autofocus=true autocomplete="${(enableWebAuthnConditionalUI?has_content)?then('username webauthn', 'username')}" value=login.username!'' />
                        <@field.password name="password" label=msg("password") required=true error="" forgotPassword=realm.resetPasswordAllowed autofocus=usernameHidden?? autocomplete="current-password">
                            <#if realm.rememberMe && !usernameHidden??>
                                <@field.checkbox name="rememberMe" label=msg("rememberMe") value=login.rememberMe?? />
                            </#if>
                        </@field.password>
                    <#else>
                        <@field.password name="password" label=msg("password") required=true forgotPassword=realm.resetPasswordAllowed autofocus=usernameHidden?? autocomplete="current-password">
                            <#if realm.rememberMe && !usernameHidden??>
                                <@field.checkbox name="rememberMe" label=msg("rememberMe") value=login.rememberMe?? />
                            </#if>
                        </@field.password>
                    </#if>

                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <@buttons.loginButton />
                </form>
            </#if>
            </div>
        </div>
        <@passkeys.conditionalUIData />
    <#elseif section = "socialProviders" >
        <#if realm.password && social.providers?? && social.providers?has_content>
            <@identityProviders.show social=social/>
        </#if>
    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration-container">
                <div id="kc-registration">
                    <span>${msg("noAccount")} <a href="${url.registrationUrl}">${msg("doRegister")}</a></span>
                </div>
            </div>
        </#if>
    </#if>

</@layout.registrationLayout>
```

- [ ] **Step 3: Verify FreeMarker parses the file and the heading renders**

```bash
CHALLENGE=$(printf '%s' "verifier1234567890verifier1234567890verifier12" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=')
curl -s "http://localhost:8080/realms/asce-lc-realm/protocol/openid-connect/auth?client_id=account-console&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Frealms%2Fasce-lc-realm%2Faccount%2F&response_type=code&scope=openid&code_challenge_method=S256&code_challenge=$CHALLENGE" -o /tmp/login-check.html -w "%{http_code}\n"
grep -o 'asce-login-title' /tmp/login-check.html
grep -c 'pf-v5-c-form__label-required' /tmp/login-check.html
```

Do not use `curl http://localhost:8080/realms/asce-lc-realm/account/` alone — see Global Constraints for why that returns the wrong page for `curl`.

Expected: `200` status, `asce-login-title` found once, and the required-asterisk class counted **2** times (username + password).

---

### Task 4: Rewrite `resources/css/login.css`

**Files:**
- Modify (full rewrite): `themes/asce-lc/login/resources/css/login.css`

**Interfaces:**
- Consumes: `.asce-brand-panel` / `.asce-brand-top` / `.asce-brand-mid` / `.asce-brand-star` / `.asce-brand-tagline` / `.asce-brand-features` / `.asce-brand-copyright` from Task 2; `.asce-login-heading` / `.asce-login-title` / `.asce-login-subtitle` from Task 3; PatternFly class names confirmed in Global Constraints (`pf-v5-c-form-control`, `pf-v5-c-login__container`, `pf-v5-c-login__main`, `pf-v5-c-form__label-required`, `pf-v5-c-check__label`, `pf-v5-c-helper-text`).
- Produces: the final visual design. No later task depends on new class names from this file.

- [ ] **Step 1: Replace the full file content**

```css
/* ============================================================
   CGE AGENDA — ASCE-LC  |  Login theme v7 — panneau encadré
   ============================================================ */

:root {
  --green:  #1AAF1A;
  --g-mid:  #178f17;
  --g-dark: #136f13;
  --gold:   #f2c14e;
  --white:  #ffffff;
  --bg:     #eef0f4;
  --text:   #0f172a;
  --muted:  #64748b;
  --border: #dde3ec;
  --r:      24px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  font-family: 'Segoe UI', Inter, system-ui, sans-serif !important;
}

body {
  min-height: 100vh !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: var(--bg) !important;
  padding: 24px !important;
}

/* ── Neutraliser les enveloppes PatternFly qui n'ont pas besoin de style ── */
.pf-v5-c-page,
.pf-v5-c-login {
  all: unset !important;
  display: contents !important;
}

/* ══════════════════════════════════════════════════════════════
   CARTE — panneau de marque + formulaire côte à côte
   ══════════════════════════════════════════════════════════════ */
.pf-v5-c-login__container {
  display: flex !important;
  flex-direction: row !important;
  align-items: stretch !important;
  width: 100% !important;
  max-width: 900px !important;
  background: var(--white) !important;
  border-radius: var(--r) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.12) !important;
  overflow: hidden !important;
}

/* ── Masquer les éléments non voulus ── */
#kc-header,
#kc-header-wrapper,
.pf-v5-c-login__header,
.pf-v5-c-login__main-header,
#kc-locale,
.kc-locale-dropdown,
[id="kc-locale"],
[id*="locale"],
select[name="locale"] {
  display: none !important;
  visibility: hidden !important;
}

.pf-v5-c-login__main-footer:empty { display: none !important; }

/* ══════════════════════════════════════════════════════════════
   PANNEAU DE MARQUE
   ══════════════════════════════════════════════════════════════ */
.asce-brand-panel {
  flex: 0 0 42% !important;
  position: relative !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  padding: 36px 40px 28px !important;
  background: linear-gradient(170deg, #0f3d12 0%, #0a2810 55%, #061a07 100%) !important;
  color: var(--white) !important;
}

/* Silhouette de loupe en filigrane */
.asce-brand-panel::before {
  content: '';
  position: absolute;
  right: -140px;
  bottom: -110px;
  width: 440px;
  height: 440px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='82' cy='82' r='58' fill='none' stroke='white' stroke-width='9'/%3E%3Cline x1='124' y1='124' x2='178' y2='178' stroke='white' stroke-width='16' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat center / contain;
  opacity: 0.09;
  transform: rotate(-14deg);
  pointer-events: none;
  z-index: 0;
}

.asce-brand-top,
.asce-brand-mid,
.asce-brand-copyright {
  position: relative;
  z-index: 1;
}

.asce-brand-logo {
  width: 150px;
  height: auto;
  display: block;
}

.asce-brand-star {
  display: block;
  width: 16px;
  height: 16px;
  margin-bottom: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2l2.9 6.9L22 9.6l-5.5 5 1.6 7.4L12 18.6 5.9 22l1.6-7.4L2 9.6l7.1-.7L12 2z' fill='%23f2c14e'/%3E%3C/svg%3E") no-repeat center / contain;
}

.asce-brand-tagline {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.4px;
  margin-bottom: 14px;
}

.asce-brand-features {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.45);
}

.asce-brand-copyright {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
}

/* ══════════════════════════════════════════════════════════════
   FORMULAIRE
   ══════════════════════════════════════════════════════════════ */
.pf-v5-c-login__main {
  flex: 1 1 58% !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  padding: 48px 44px !important;
  background: var(--white) !important;
}

.pf-v5-c-login__main-body {
  width: 100% !important;
  max-width: 420px !important;
  margin: 0 auto !important;
}

.asce-login-heading { margin-bottom: 26px; }

.asce-login-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.4px;
  margin-bottom: 6px;
}

.asce-login-subtitle {
  font-size: 13.5px;
  font-weight: 400;
  color: var(--muted);
}

/* ── Labels ── */
.pf-v5-c-form__group { margin-bottom: 16px !important; }

.pf-v5-c-form__label-text {
  display: block !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #334155 !important;
  margin-bottom: 7px !important;
}

.pf-v5-c-form__label-required {
  color: #dc2626 !important;
  margin-left: 3px !important;
}

/* ── Champs : neutraliser le wrapper PatternFly, styliser le vrai <input> ──
   (le bug de "boîte dans la boîte" venait du fait que ce wrapper gardait
   son style par défaut pendant qu'on stylisait l'input à l'intérieur) */
.pf-v5-c-form-control {
  all: unset !important;
  display: block !important;
  position: relative !important;
  width: 100% !important;
}

input[type="text"],
input[type="password"],
input[type="email"] {
  width: 100% !important;
  height: 48px !important;
  background: #f8fafc !important;
  border: 1.5px solid var(--border) !important;
  border-radius: 10px !important;
  padding: 0 44px 0 14px !important;
  font-size: 14px !important;
  color: var(--text) !important;
  transition: border-color .18s, box-shadow .18s, background .18s !important;
}
input[type="text"]:hover,
input[type="password"]:hover { border-color: #b0bec5 !important; background: #f1f5f9 !important; }

input#username {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 14px center !important;
  background-size: 18px !important;
}

input:focus {
  background: var(--white) !important;
  border-color: var(--green) !important;
  box-shadow: 0 0 0 3px rgba(26,175,26,.15) !important;
  outline: none !important;
}

/* ── Bouton de visibilité du mot de passe (icône œil déjà native) ── */
.pf-v5-c-input-group { align-items: center !important; gap: 8px !important; }
.pf-v5-c-button.pf-m-control {
  background: transparent !important;
  border: none !important;
  color: #94a3b8 !important;
  width: 40px !important;
  height: 40px !important;
  border-radius: 8px !important;
  cursor: pointer !important;
}
.pf-v5-c-button.pf-m-control:hover { background: #f1f5f9 !important; color: var(--muted) !important; }

/* ── Options (case à cocher + mot de passe oublié) ──
   .pf-v5-c-helper-text est déjà display:flex + justify-content:space-between
   via les classes utilitaires PatternFly (kcInputHelperTextClass) : on ne
   redéclare pas display/justify-content ici, seulement l'espacement. */
.pf-v5-c-helper-text {
  margin: 14px 0 22px !important;
  align-items: center !important;
}
.pf-v5-c-check__label {
  font-size: 13px !important;
  font-weight: 400 !important;
  color: var(--muted) !important;
}

/* ── Bouton principal ── */
#kc-login {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important;
  width: 100% !important;
  background: var(--green) !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 14px 20px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  color: var(--white) !important;
  cursor: pointer !important;
  letter-spacing: .3px !important;
  box-shadow: 0 4px 18px rgba(26,175,26,.28) !important;
  transition: background .18s, transform .14s, box-shadow .18s !important;
}
#kc-login::before {
  content: '';
  width: 18px;
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12h14M13 6l6 6-6 6'/%3E%3C/svg%3E") no-repeat center / contain;
}
#kc-login:hover {
  background: var(--g-mid) !important;
  box-shadow: 0 6px 24px rgba(26,175,26,.40) !important;
  transform: translateY(-1px) !important;
}
#kc-login:active { background: var(--g-dark) !important; transform: translateY(0) !important; }

/* ── Liens ── */
a { color: var(--green) !important; font-size: 13px !important; font-weight: 600 !important; text-decoration: none !important; }
a:hover { color: var(--g-dark) !important; text-decoration: underline !important; }

/* ── Lien d'inscription ── */
#kc-info {
  margin-top: 18px !important;
  padding-top: 16px !important;
  border-top: 1px solid var(--border) !important;
  text-align: center !important;
  font-size: 13px !important;
  color: var(--muted) !important;
}

/* ── Erreurs ── */
.pf-v5-c-alert.pf-m-danger, .alert.alert-error, #input-error {
  background: #fff8f8 !important;
  border: 1.5px solid #fca5a5 !important;
  border-radius: 10px !important;
  color: #dc2626 !important;
  padding: 11px 15px !important;
  margin-bottom: 16px !important;
  font-size: 13px !important;
}

/* ── Mobile ── */
@media (max-width: 800px) {
  body { padding: 0 !important; align-items: flex-start !important; }
  .pf-v5-c-login__container {
    flex-direction: column !important;
    max-width: 100% !important;
    border-radius: 0 !important;
    min-height: 100vh !important;
  }
  .asce-brand-panel { flex: 0 0 auto !important; padding: 28px 28px 22px !important; }
  .asce-brand-panel::before { width: 260px; height: 260px; right: -80px; bottom: -70px; }
  .asce-brand-tagline { font-size: 22px; }
  .pf-v5-c-login__main { padding: 32px 24px !important; }
}
```

- [ ] **Step 2: Verify the CSS loads**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/realms/asce-lc-realm/resources/*/login/asce-lc/css/login.css
```

Expected: `200`. (Keycloak versions the resource path with a build hash — if this exact wildcard doesn't resolve with your shell, instead open the login page HTML from Task 3 and copy the real `<link href=... rel="stylesheet">` value for `login.css`, then `curl` that exact URL.)

- [ ] **Step 3: Manual visual verification in a browser**

Open `http://localhost:8080/realms/asce-lc-realm/account/` and confirm, against the approved design spec (`docs/superpowers/specs/2026-07-01-keycloak-asce-lc-login-redesign-design.md`):

- [ ] One white rounded card, centered, with a visible drop shadow — not a full-bleed split screen.
- [ ] Left panel is green, shows the logo, a faint diagonal magnifying-glass watermark, a small gold star, the tagline "Gérez votre agenda institutionnel depuis un seul endroit.", the feature line, and the copyright — all real visible text (not blank).
- [ ] Right side shows "Connexion" as a bold title with "Bienvenue, accédez à votre espace" directly under it.
- [ ] Username and password fields are a **single** bordered box each (no nested/double box), with the icon on the **right** side of the field, and a single green focus ring (no stray blue browser outline).
- [ ] "Se souvenir de moi" and "Mot de passe oublié ?" sit on the same row.
- [ ] The green button reads "Se connecter" with a small arrow icon to its left.
- [ ] Resize the window below 800px wide: the panel becomes a top banner and the form stacks below it, still legible.

If any of these fail, fix the corresponding CSS rule and re-check — do not proceed until all boxes are confirmed against a real render.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-01-keycloak-asce-lc-login-redesign.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
