# cdec-download
CDEC Data Download Tool
http://cdec.water.ca.gov

Given a station id and a date, will download all available data for specified station for that day.

# Install

NodeJS/NPM is required, follow install instructions here:
https://nodejs.org/en/download/

then run the following in shell:
```bash
npm install -g @ucd-lib/cdec-download
```

# Usage

Open shell and run ```cdec-download``` followed by a station id and ISO 8601 date.

```bash
cdec-download [station] [action] [type]
```

Actions: info, yearly, monthly, hourly
Types: flow, riv stg, bat vol

example:

Download hourly data for one day

```bash
cdec-download LSR hourly flow -d 2018-02-01
```

Download all hourly data for one month, then create a month summary averaged by day.

```bash
cdec-download SRM monthly flow -d 2018-05
```

Get the station info url
```bash
cdec-download SRM info
```

# Station IDs

Can be found via: [map](http://cdec.water.ca.gov/cdecstation2) or [search](http://cdec.water.ca.gov/dynamicapp/staSearch)