# Destroy Ocean City

Sometimes you must destroy what you love to really save it.

See the current production build at [Destroy Ocean City](https://destroyocean.city).

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.6 and upgraded to version 21.4.2.

## Prepare your Environment

Developing, building, and running the application locally requires the latest [Node Package Manager](https://www.npmjs.com).

Once NPM is installed locally, you will need to install Angular by using the following command.

```bash
npm install -g @angular/cli
```

## Running the Development Server

To start a local development server, run the following command in `/angular`. This command installs necessary node packages for developing and building the Angular application.

```bash
npm install
```

Next, use the following command to launch the Angular app in development mode.

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4400/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project, run the following in /angular:

```bash
ng build --configuration production
```

This will compile the project and store the build artifacts in the `dist/destroyOceanCity` directory. Note that automatic deployments do not use the main branch or the `/angular/dist` directory, instead favoring the `/angular/angular-deploy` directory.

## Automatic Deployment with Github Connect

If this is the first time you are using the deployment script, you must first authorize it by running the following in `/angular`:

```bash
chmod +x deploy.sh
```

Then, you can use the following command within /angular to automate pushing builds to the dist branch and automatic deployment:

```bash
./deploy.sh
```

## Backend Outages and Maintenance Mode

When the backend API is unavailable, the app stops routing entirely and replaces the whole site (header, views, store, and footer) with a black screen showing the site logo and a status message. The URL is left untouched, so once the backend recovers, a refresh returns visitors to the page they were on.

The app checks the API once before first render, then watches every API request for the rest of the visit. The logic lives in `src/app/services/maintenance-service.ts` and `src/app/services/maintenance-interceptor.ts`; the screen itself is `src/app/structural/maintenance/maintenance.ts`.

There are two states:

| State | Triggered by | Message |
| --- | --- | --- |
| Maintenance | A `503` with the body `{"code":"backend_offline"}`, from any request | Structural windmill damage inspection |
| Outage | A request to `api.destroyocean.city` that is unreachable (status `0`) or returns a Cloudflare gateway error (`502`, `503`, `504`, `520`–`527`, `530`) | Rogue offshore gust |

Maintenance takes precedence over an outage. Plain `500` errors and failures from `dropship.destroyocean.city` do not trigger either state; they show the usual error alert instead.

### Putting the site into maintenance mode

Configure nginx on the backend to answer API requests with the `backend_offline` response. The response must include the `Access-Control-Allow-Origin` header (use `add_header ... always`), otherwise the browser hides the response and the app shows the outage screen instead:

```bash
curl -si -H "Origin: https://destroyocean.city" https://api.destroyocean.city/json/
```

This should return `HTTP/2 503`, `access-control-allow-origin: https://destroyocean.city`, and `{"code":"backend_offline",...}`.

### Notes

- If the startup check takes longer than 3 seconds, the site loads normally; any later failure will still trigger the appropriate screen.
- A single failed request is enough to trigger the outage screen.
- The app calls the production API directly, even from `ng serve`. If the API does not allow `localhost` as an origin, the browser blocks its responses and local development will show the outage screen. To preview the maintenance screen locally, temporarily return `true` from `isOfflineResponse`.

## Additional Resources

For more information on using the Angular CLI, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

For references to Angular 20, visit the [Angular 20 Reference](https://angular.dev) guide.

For help with Bootstrap 4.1 utilities, visit [Bootstrap Getting Started](https://getbootstrap.com/docs/4.1/getting-started/introduction/).

