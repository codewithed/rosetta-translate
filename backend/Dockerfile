# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy only pom.xml first for better Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create runtime image
FROM amazoncorretto:21.0.8-alpine3.22

WORKDIR /app

# Copy the JAR file (using wildcard to avoid hardcoding version)
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Add JVM options for containerized environments
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]