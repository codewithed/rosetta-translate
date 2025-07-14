package com.translationapp;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RosettaApplication {

	public static void main(String[] args) {
		// Load .env file
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

		// Set system properties from .env, trimming values
		dotenv.entries().forEach(entry -> {
			String key = entry.getKey();
			String value = entry.getValue();
			if (value != null) {
				System.setProperty(key, value.trim());
			}
			// Optional: else { System.setProperty(key, ""); } // If you prefer empty string for nulls
		});

		// For debugging, you can print specific properties after loading:
		// System.out.println("DEBUG: spring.datasource.url is trying to use DB_HOST = [" + System.getProperty("DB_HOST") + "]");
		// System.out.println("DEBUG: DB_USERNAME = [" + System.getProperty("DB_USERNAME") + "]");
		// System.out.println("DEBUG: DB_PASSWORD = [" + System.getProperty("DB_PASSWORD") + "]"); // Be cautious with logging passwords

		SpringApplication.run(RosettaApplication.class, args);
	}

}