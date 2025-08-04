
package com.project.restau_management.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductFamilyDTO {

    public String productFamilyId;
    public String name;
    public String description;
    public String imageUrl;
    public String imageAltText;
    public String categoryId;
}