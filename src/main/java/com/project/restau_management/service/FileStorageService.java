package com.project.restau_management.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    /**
     * Store an uploaded file in the specified subdirectory
     * @param file The MultipartFile to store
     * @param subDirectory The subdirectory within the upload directory
     * @return The relative URL path to access the stored file
     * @throws IOException If file storage fails
     */
    public String storeFile(MultipartFile file, String subDirectory) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IOException("Cannot store empty file");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        // Store the file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return the relative URL path
        return "/" + subDirectory + "/" + uniqueFilename;
    }

    /**
     * Delete a file using its relative path
     * @param relativePath The relative path of the file to delete
     * @throws IOException If file deletion fails
     */
    public void deleteFile(String relativePath) throws IOException {
        if (relativePath == null || relativePath.isEmpty()) {
            return;
        }

        // Remove leading slash if present
        String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        Path fileToDelete = Paths.get(uploadDir, cleanPath);

        if (Files.exists(fileToDelete)) {
            Files.delete(fileToDelete);
        }
    }

    /**
     * Check if a file exists
     * @param relativePath The relative path of the file
     * @return true if file exists, false otherwise
     */
    public boolean fileExists(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return false;
        }

        String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        Path filePath = Paths.get(uploadDir, cleanPath);
        return Files.exists(filePath);
    }

    /**
     * Get the full file path for a relative path
     * @param relativePath The relative path
     * @return The full file system path
     */
    public Path getFullPath(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return null;
        }

        String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        return Paths.get(uploadDir, cleanPath);
    }

    /**
     * Get file extension from filename
     * @param filename The filename
     * @return The file extension including the dot, or empty string if no extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Validate that the file is an image
     * @param file The file to validate
     * @return true if valid image, false otherwise
     */
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }

        return contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/gif") ||
                contentType.equals("image/webp");
    }

    /**
     * Validate file size
     * @param file The file to validate
     * @param maxSizeInBytes Maximum allowed size in bytes
     * @return true if file size is within limit, false otherwise
     */
    public boolean isValidFileSize(MultipartFile file, long maxSizeInBytes) {
        return file != null && file.getSize() <= maxSizeInBytes;
    }
}