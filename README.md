# Link Analytics Backend

This is the backend server for a URL shortening and analytics platform. It provides API endpoints for creating short URLs, redirecting to original URLs, managing user authentication, and retrieving analytics data.

## Features

* **URL Shortening:** Generates short, unique aliases for long URLs.  Allows for custom aliases.
* **User Authentication:** Secure user registration and login using JWT.
* **URL Management:** Create, retrieve, and delete shortened URLs.
* **Click Tracking:** Logs detailed information about each click on a shortened URL (device, browser, OS, IP address, etc.).
* **Analytics:** Provides insights into URL usage, including click counts, click history, device/browser/OS breakdown.
* **URL Expiration:** Option to set expiration dates for shortened URLs.

## Technologies Used

* **Node.js:** JavaScript runtime environment
* **Express:** Web application framework for Node.js
* **MongoDB:** NoSQL database
* **Mongoose:** MongoDB object modeling tool
* **jsonwebtoken:** JSON Web Token for authentication
* **bcryptjs:** For hashing passwords
* **nanoid:** For generating unique URL codes
* **ua-parser-js:** For parsing user-agent strings
* **dotenv:** For managing environment variables
* **cors:** For enabling Cross-Origin Resource Sharing

## Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/anudeeps0306/server
    cd server
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**

    * Create a `.env` file in the root directory.
    * Add the following variables:

        ```
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret_key
        PORT=5000  # or your preferred port
        ```

    * Replace `your_mongodb_connection_string` and `your_jwt_secret_key` with your actual MongoDB connection string and a strong, secret key for JWT.

4.  **Run the server:**

    ```bash
    npm start         # To start the server
    npm run dev     # To start the server with nodemon for development
    ```

    The server will start at `http://localhost:5000` (or the port you specified).

## API Endpoints

### Authentication

* `POST /api/auth/login`:   Authenticate user and get JWT token.
    * Request body: `{ email, password }`
    * Response: `{ token }`
* `GET /api/auth/user`:  Get user data (requires authentication).
    * Headers: `x-auth-token: <token>`
    * Response: `{ id, email, createdAt }`

### URL Management

* `POST /api/url`:  Create a shortened URL (requires authentication).
    * Headers: `x-auth-token: <token>`
    * Request body: `{ originalUrl, customAlias?, expirationDate? }`
    * Response: `{ _id, userId, originalUrl, shortCode, clicks, expiresAt, createdAt }`
* `GET /api/url`:  Get all URLs for the authenticated user (requires authentication).
    * Headers: `x-auth-token: <token>`
    * Response: `[ { _id, userId, originalUrl, shortCode, clicks, expiresAt, createdAt }, ... ]`
* `GET /api/url/:id/analytics`:  Get analytics for a specific URL (requires authentication).
    * Headers: `x-auth-token: <token>`
    * Response:
        ```json
        {
          "url": { ...urlData },
          "clicksOverTime": [ { "date": "YYYY-MM-DD", "clicks": number } ],
          "deviceBreakdown": [ { "device": "Device Type", "count": number } ],
          "browserBreakdown": [ { "browser": "Browser Name", "count": number } ],
          "totalClicks": number
        }
        ```
* `DELETE /api/url/:id`:  Delete a URL (requires authentication).
    * Headers: `x-auth-token: <token>`
    * Response: `{ msg: "URL removed" }`

### URL Redirection

* `GET /:code`:  Redirect to the original URL based on the short code.  This route also tracks clicks.
    * Response:  HTTP Redirect to the original URL

## Models

* **User:**
    * `email` (String, required, unique)
    * `password` (String, required)
    * `createdAt` (Date)
* **Url:**
    * `userId` (ObjectId, ref: 'User', required)
    * `originalUrl` (String, required)
    * `shortCode` (String, required, unique)
    * `clicks` (Number)
    * `expiresAt` (Date)
    * `createdAt` (Date)
* **ClickData:**
    * `urlId` (ObjectId, ref: 'Url', required)
    * `timestamp` (Date)
    * `ip` (String)
    * `browser` (String)
    * `os` (String)
    * `device` (String)
    * `country` (String, default: 'Unknown')
    * `referrer` (String, default: 'Direct')

## Authentication

* Authentication is implemented using JSON Web Tokens (JWT).
* The `auth` middleware (`middleware/auth.js`) is used to protect routes that require authentication.  It extracts the token from the `x-auth-token` header and verifies it.
* Upon successful login (`/api/auth/login`), the server returns a JWT that the client should store and include in the headers of subsequent requests to protected routes.

## Click Tracking

* The `/ :code` route in `routes/redirect.js` handles redirection and click tracking.
* It uses the `ua-parser-js` library to gather information about the user's device, browser, and OS.
* Click data is stored in the `ClickData` model in MongoDB.
* `Promise.all()` is used to asynchronously save the click data and update the URL's click count, ensuring efficient performance.

## Error Handling

* The server returns appropriate HTTP status codes for errors (e.g., 400 for bad requests, 401 for unauthorized access, 404 for not found, 500 for server errors).
* Error messages are typically returned in JSON format: `{ msg: "Error message" }`
