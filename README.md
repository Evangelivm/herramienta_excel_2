# Excel Processing Tool Documentation

## Overview

This application is designed to process and transform Excel files containing accounting data into a standardized format for database insertion. It's built with **Next.js** and provides a web interface for file upload and data processing.

## Core Features

### 1. Excel File Processing

- Accepts `.xlsx` files as input
- Extracts specific columns from the input file:
  - Identification information
  - Names
  - Base amounts
  - IGV (tax) amounts
  - Totals
  - Currency information

### 2. Data Preview

Displays a preview table showing:

- Identification numbers
- Names
- Base amounts (BI)
- IGV amounts
- Total amounts
- Currency type (`MN` for PEN, `US` for USD)

### 3. Transaction Number Management

Provides two options:

- **Auto-numbering** starting from `0001`
- **Manual numbering** with current record number lookup

### 4. Month Selection

- Includes a dropdown menu for selecting the transaction month
- Automatically filters available months based on the current date
- Integrates with the transaction numbering system

### 5. Database Integration

- Connects to a MySQL database using environment variables
- Performs **batch insertions** of processed data
- Maintains **transaction number sequences**
- Provides feedback on insertion success/failure

## Technical Components

### Database Configuration

Defined in `mysql.ts`:

```ts
{
  host: process.env.HOST_NAME,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT
}
```

### API Endpoints

- `route.ts` – Handles data insertion into the database
- `query.ts` – Retrieves the latest transaction number

### Data Processing

- Uses `ExcelJS` for file parsing
- Implements **error handling** and **validation**
- Provides progress feedback using **toast notifications**

## Usage Flow

1. User uploads an Excel file through the web interface
2. System displays a preview of the extracted data
3. User selects the transaction month
4. User chooses numbering method (auto or manual)
5. System processes and validates the data
6. Data is inserted into the database
7. System provides confirmation and transaction IDs

## Error Handling

- Validates file format and content
- Provides user feedback via toast notifications
- Implements database error handling
- Includes transaction rollback capabilities

## Environment Requirements

- **Node.js**
- **MySQL database**
- Required environment variables:
  - `HOST_NAME`
  - `DB_USER`
  - `DB_NAME`
  - `DB_PASS`
  - `DB_PORT`

## Production Deployment

Docker configuration included for deployment:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    environment:
      NODE_ENV: production
      PORT: 3003
      HOSTNAME: 0.0.0.0
```
