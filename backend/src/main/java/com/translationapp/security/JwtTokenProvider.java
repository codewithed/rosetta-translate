package com.translationapp.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs}")
    private int jwtExpirationInMs;

    private Key key;

    @PostConstruct
    public void init() {
        System.out.println("Attempting to initialize JWT key. Raw jwtSecret from properties/env: '" + jwtSecret + "'");
        if (jwtSecret != null) {
            System.out.println("Byte length of jwtSecret: " + jwtSecret.getBytes().length);
        } else {
            System.out.println("jwtSecret is null!");
        }
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(authToken);
            return true;
        } catch (io.jsonwebtoken.security.SignatureException ex) {
            // JWT signature does not match locally computed signature
            System.err.println("Invalid JWT signature: " + ex.getMessage());
            return false;
        } catch (io.jsonwebtoken.MalformedJwtException ex) {
            // JWT was not correctly constructed
            System.err.println("Invalid JWT token: " + ex.getMessage());
            return false;
        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            // JWT token has expired
            System.err.println("JWT token is expired: " + ex.getMessage());
            return false;
        } catch (io.jsonwebtoken.UnsupportedJwtException ex) {
            // JWT token is unsupported
            System.err.println("JWT token is unsupported: " + ex.getMessage());
            return false;
        } catch (IllegalArgumentException ex) {
            // JWT claims string is empty
            System.err.println("JWT claims string is empty: " + ex.getMessage());
            return false;
        }
    }
} 