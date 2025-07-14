#!/bin/bash

# Update persistence imports
find src/main/java -type f -name "*.java" -exec sed -i '' 's/import javax\.persistence\./import jakarta.persistence./g' {} +

# Update validation imports
find src/main/java -type f -name "*.java" -exec sed -i '' 's/import javax\.validation\./import jakarta.validation./g' {} +

# Update servlet imports
find src/main/java -type f -name "*.java" -exec sed -i '' 's/import javax\.servlet\./import jakarta.servlet./g' {} +

# Update annotation imports
find src/main/java -type f -name "*.java" -exec sed -i '' 's/import javax\.annotation\./import jakarta.annotation./g' {} +
