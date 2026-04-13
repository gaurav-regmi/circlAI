CirclAI

CirclAI is an event-driven social platform built during a 2-day hackathon organized by Wildfire Labs. It focuses on helping people connect before, during, and after events through real-time interaction, interest-based communities, and AI-powered features.

Overview

CirclAI goes beyond traditional event platforms by enabling meaningful engagement among attendees. Users can discover events, connect with like-minded individuals, and continue conversations even after the event ends.

Features
* Event discovery (public and private events)
* View attendees and participation insights
* Real-time communication within events
* Create and join interest-based chat rooms
* Send and manage connection requests
* AI-powered chatbot for event information
* AI-generated event descriptions for organizers
* People recommendation system based on:
    * Shared interests
    * Mutual event participation

Tech Stack

Backend
* Java
* Spring Boot
* Spring AI

Frontend
* Angular

AI Integration
* Claude API (Anthropic)

Cloud & Storage
* AWS S3 for storing images and files

Architecture (High Level)
* RESTful APIs built with Spring Boot
* Angular frontend consuming APIs
* AI services integrated via Spring AI and Claude API
* Media storage handled through AWS S3
* Modular design supporting scalability and feature expansion

Getting Started

Prerequisites
* Java 17+
* Node.js & Angular CLI
* AWS account (for S3)
* Claude API key

Backend Setup

git clone https://github.com/gaurav-regmi/circlAI.git
cd circlAI/circl

Update application.yml:

aws:
  accessKey: YOUR_ACCESS_KEY
  secretKey: YOUR_SECRET_KEY
  region: YOUR_REGION
  bucketName: YOUR_BUCKET_NAME

claude:
  apiKey: YOUR_API_KEY

Run the backend:

./mvnw spring-boot:run

Frontend Setup

cd circlAI/circl-ui
npm install
ng serve

Access the app at:

http://localhost:4200

API Highlights
* Event management APIs
* User connection APIs
* Chat and group APIs
* AI-powered endpoints for:
    * Chatbot interaction
    * Event description generation
    * Recommendations
