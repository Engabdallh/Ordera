# Ordera Notes

## Project Idea

Ordera is a restaurant ordering and call center system.

## Architecture

The project uses MVC architecture.

### Models

Responsible for data and database models.
User
Restaurant
Product
Order

### Views
Responsible for the user interface.
Customer Website
Restaurant Dashboard

### Controllers
تستقبل الطلب وتقرر شو لازم يصير.
Handle incoming requests and control the application flow.
Customer → طلب منتج
              ↓
        OrderController

### Routes
تحدد عناوين الـAPI والطلبات.
Define the API endpoints.
POST /api/orders
GET  /api/orders
GET  /api/menu

### Services
هنا نحط منطق العمل الحقيقي.
Contain the business logic.
OrderService
- احسب المجموع
- تأكد من المنتجات
- أنشئ الطلب
- غيّر حالة الطلب

### Database
Contains database connection and SQL files.

## Technologies

- Node.js
- Express.js
- MySQL

#انشاء برانش
1-git checkout -b development
2-git branch
* development
  main
3-git status

#عمل أول Commit
1-git add .
2-git commit -m "Initial Ordera project setup"
3-git push -u origin development

## Running the Server

We use Express.js to create the web server.

The server runs on port 9000.

To start the server:

npm start

The application is available at:

http://localhost:9000

## MVC Request Flow

When the user visits:

GET /

The request goes through:

Browser
↓
Route
↓
Controller
↓
Response

### Example

GET /
↓
homeRoutes.js
↓
HomeController.js
↓
res.send("Welcome to Ordera")
