# Use an official OpenJDK base image
FROM openjdk:21-jdk-slim

# Create app directory inside the container
WORKDIR /app

# Copy the jar into the container
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
