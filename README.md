# Goally API

This is the backend REST API for apps in the Goally project.

## About the Goally project

The Goally project is going to be a series of apps built in different frontend frameworks (e.g. Angular, Next.js, Nuxt.js, SvelteKit, etc.) that share this as a common API. I'm using this project as a way to grow my full-stack skills, creating a portfolio in the process.

Goally itself is just a todo list app. The purpose of this API is to:

- Allow a user to create, update, and delete an account
- Log into and out of that account
- Create, view, update, and delete goals

It's intentionally simple so that I don't have to overthink the functionality, though I may consider adding more features over time.

### This is so not SaaS

I want to make it super clear that I am not intending this to be a full-fledged SaaS or anything (the world has enough todo list apps, I think). Becuase I want to both keep costs down and not be responsible for anyone's important data, I am:

- Not asking for an email address to sign up (just a username), so less PII in the database
- Using the bare minimum hosting resources as possible
- Removing users after 24 hours of inactivity

Of course, I'll have a disclaimer in the client-side apps about that last point. However, this should allow anyone interested enough time to explore before their data is cleared.

This does not mean I'm compromising on security best practices -- passwords are still hashed before being stored in the database, session cookies are signed, CSRF protection is implemented, and I've got CORS and Helmet.js middleware applied.

## Trying this out

If you'd like to try out this API for yourself locally, you'll first need to set up a Postgres database on your local machine (e.g. via Homebrew or Docker) and create a database (you can name it "goally" or something else, if you'd like). Then:

1. Clone the repo
2. Run `npm install`
3. Create a copy of `.env.example` as `.env`.
   - Set `PORT` to the port on which you want the app to listen
   - Set `APP_DOMAIN` to `localhost`
   - Set `DB_CLIENT` to `pg`
   - Set `DB_URI` to the Postgres connection string for your local instance
   - Set `NODE_ENV` to `development`
   - Set `SECRET_KEY` to any string you'd like since it's just localhost, but on production you'd want to use the output of something cryptographically secure, like `crypto.randomBytes(32).toString("hex")`
4. Start Postgres, then run `npm run migrate` to create the database tables
5. Run `npm dev`

Of course, if Postgres is not your thing, you could certainly refactor this a bit to use a different Knex-supported database. I simply chose it because it has the most cost-effective hosting options for this project.

### About CSRF protection

Before making any POST, PUT, PATCH, or DELETE requests, the client must first obtain a CSRF token via a GET request to `/csrf-token`. This will set an `XSRF-TOKEN` cookie. It is up to the client to include that value in an `X-XSRF-TOKEN` header with those requests, along with the cookie.

It is not necessary to request a new token for each request; once per session should suffice.

## Documentation

You can find documentation for all endpoints in the [wiki](https://github.com/t-bowersox/goally-api/wiki).
