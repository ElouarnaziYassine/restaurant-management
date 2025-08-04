package com.project.restau_management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded files statically
        String uploadPath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();

        // Handler for product images
        registry.addResourceHandler("/products/**")
                .addResourceLocations(uploadPath + "products/")
                .setCachePeriod(3600); // Cache for 1 hour

        registry.addResourceHandler("/product-families/**")
                .addResourceLocations(uploadPath + "product-families/")
                .setCachePeriod(3600); // Cache for 1 hour

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600);
    }
}