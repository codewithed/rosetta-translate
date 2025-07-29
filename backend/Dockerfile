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
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the JAR file (using wildcard to avoid hardcoding version)
COPY --from=build /app/target/*.jar app.jar

# Set environment variables and port configuration
ENV PORT=8080
EXPOSE 8080

# Add JVM options for containerized environments
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Dio.netty.native.workdir=/tmp", "-Dcom.sun.management.jmxremote", "-jar", "app.jar"]