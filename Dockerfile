# Build : compile l'app Angular en mode production dans un conteneur jetable
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Run : Nginx sert uniquement le résultat du build
FROM nginx:1.27-alpine
COPY --from=build /build/dist/sakai-ng/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
