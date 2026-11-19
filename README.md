# UBC Course & Room Query System

A full-stack TypeScript app for querying UBC's historical course records and campus classrooms. It loads raw university data (zipped JSON course files and scraped HTML building pages), turns it into structured datasets, and answers questions written in a custom JSON query language: filters, grouping, aggregates and multi-key sorting.

**Live demo:** https://claude.ai/artifact/MzDJxDtswex4HUBh25cuaE

**Video walkthrough:** https://youtu.be/MP2shx1AZac

![Language](https://img.shields.io/badge/TypeScript-4.9-blue) ![Backend](https://img.shields.io/badge/Express-4.18-lightgrey) ![Frontend](https://img.shields.io/badge/React-18-61dafb)

## What it does

- **64,612 course sections** across 189 departments: averages, pass/fail/audit counts, instructors and years
- **364 rooms in 44 buildings**, parsed from 74 campus building pages: seats, room type, furniture and address
- **Query engine** for a custom EBNF grammar supporting:
  - `WHERE` filters: `AND`, `OR`, `NOT`, `GT`, `LT`, `EQ`, and `IS` with `*` wildcards
  - `TRANSFORMATIONS`: `GROUP` by any key, `APPLY` with `MAX`, `MIN`, `AVG`, `SUM`, `COUNT`
  - `OPTIONS`: column selection and `ORDER` by multiple keys, up or down
  - Validation that rejects malformed queries and results over 5,000 rows
- **REST API** (Express) to add, list, delete and query datasets
- **React front end** that loads datasets and charts the top or bottom 10 results

## Example query

"Average grade per CPSC course since 2010, highest first":

```json
{
  "WHERE": {
    "AND": [
      { "IS": { "sections_dept": "cpsc" } },
      { "GT": { "sections_year": 2009 } }
    ]
  },
  "OPTIONS": {
    "COLUMNS": ["sections_id", "avgGrade"],
    "ORDER": { "dir": "DOWN", "keys": ["avgGrade"] }
  },
  "TRANSFORMATIONS": {
    "GROUP": ["sections_id"],
    "APPLY": [{ "avgGrade": { "AVG": "sections_avg" } }]
  }
}
```

## Architecture

```
frontend/ (React + Tailwind + Chart.js)
    │  HTTP (fetch)
    ▼
src/rest/Server.ts (Express)
    PUT    /dataset/:id/:kind   add a zipped dataset (kind = sections | rooms)
    DELETE /dataset/:id         remove a dataset
    GET    /datasets            list loaded datasets
    POST   /query               run a query
    │
    ▼
src/controller/InsightFacade.ts
    ├─ datasetHelpers / addDatasetHelper   unzip (JSZip), parse JSON and HTML (parse5)
    ├─ models/query/*                       parse and validate the query into typed objects
    └─ performQueryHelpers/*                filter → group → apply → sort → project
    │
    ▼
data/  (datasets cached to disk as JSON, reloaded on demand)
```

## Running locally

Requires Node 18 and Yarn.

```bash
# backend (http://localhost:4321)
yarn install
yarn start

# frontend (http://localhost:3000), in a second terminal
cd frontend
npm install
npm start
```

Drag `test/resources/archives/pair.zip` onto the home page to load the course sections, then pick a dataset to query.

Tests (Mocha + Chai) cover dataset parsing, the REST server and more than 100 query cases in `test/resources/queries`:

```bash
yarn test
```

## About the live demo

The demo runs the same query engine source, compiled for the browser, with the course and room datasets preloaded. Nothing goes to a server. It returns the same results as the Node backend on the project's test queries. Building latitude and longitude are left out because the course geolocation service the rooms parser called is no longer online.

## Credits

Built for UBC CPSC 310 (Software Engineering). Starter scaffolding is from the course; the dataset parsing, query engine, REST server and front end were written by the project team.
