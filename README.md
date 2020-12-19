# CoronaCentral Web Viewer

This is a [Next.js](https://nextjs.org/) website for CoronaCentral. The text mining and machine learning pipeline is kept in a [separate Github repo](https://github.com/jakelever/corona-ml).

## Setup

To run this project, you'll need to set up a local MariaDB database with CoronaCentral documents. The scripts to do this are in the ML repo [database/](https://github.com/jakelever/corona-ml/tree/master/database) directory. You will then need to set the environmental variable JAWSDB_URL as below and replace username, password, hostname and database name accordingly. You can store this in a `.env.local` file.

```bash
JAWSDB_URL=mysql://username:password@hostname/databasename
```

## Running It

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To build and run the production server:

```bash
npm run build
npm run start
```

The [pokeWebsite.py](https://github.com/jakelever/corona-ml/blob/master/pokeWebsite.py) script in the ML repo can be used to get the website to build the important category pages.

