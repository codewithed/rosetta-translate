# Use an official OpenJDK base image
FROM openjdk:21-jdk-slim

# Create app directory inside the container
WORKDIR /app

# Copy the jar into the container
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Set environment variable
ENV PORT=8080

# Expose port 8080
EXPOSE 8080

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
