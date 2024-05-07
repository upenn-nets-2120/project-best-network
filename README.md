## Group Information
Team 13, Best Network

Members: Julia Susser, Vedha Avali, Kimberly Liang, Cameron Bosio-Kim

SEAS emails: jsusser@seas.upenn.edu, vavali@seas.upenn.edu, kimliang@seas.upenn.ed, cbos@seas.upenn.edu

## Features Implemented:
* User account creation and login with profile picture upload
* Home page with feed display where users can upload posts
* Friends page that shows current friends who are online (logged in), not online, and a list of friend recommendations; allows for adding/removal of friends
* Profile Page that displays profile information for a user, also allows them to alter profile photo and hashtag interests
* Profile Settings page where users can update any other aspect of their 
* Actor page where users can Link an actor to their profile
* Chat page where users are available to create, join, and leave new chat rooms and communicate with other users in chat rooms

## Instructions for Running Locally from main:

### Backend:

**Step 1: Connect to RDS via EC2 Tunnel**
1. Create RDS Database & EC2 Instance.
2. Connect EC2 instance to RDS database.
3. Connect to EC2 instance/RDS Tunnel via command: 
   ```
   ssh -i ~/.ssh/{your_key}.pem -4 -L 3306:{rds-endpoint.us-east-1.rds.amazonaws.com}:3306 ubuntu@{ec2-endpoint.compute-1.amazonaws.com}
   ```
4. Set up database:
   ```
   sudo apt update
   sudo apt install mysql-client-core-8.0
   mysql --host={rds-endpoint}.us-east-1.rds.amazonaws.com --user=admin --password=best-network
   create database bestnetworkDB;
   exit
   ```
5. Then create .env file and add the following lines:
   ```
   export RDS_USER="admin"
   export RDS_PWD="best-network"
   export OPENAI_API_KEY=""
   ```
6. Run `source .env`.

**Step 2: Run Code**
- run npm install
- Execute `npm start`.

**Create Tables:**
- Run `npm create_tables`.

**ChromaDB:**
- NLP

### Frontend:
- cd frontend then npm install
- Execute `npm run dev --host`.

### Spark
1. Compile the project:
   ```bash
   mvn compile
   mvn exec:java@foaf_spark
   mvn clean
    ```

#### We created separate branch (ec2) for hosting on cloud where the localhost root urls for server are replaced with ec2 instance public ip

## Declaration:
All code submitted was written by us or inspired by previous homework assignments in this course. 
