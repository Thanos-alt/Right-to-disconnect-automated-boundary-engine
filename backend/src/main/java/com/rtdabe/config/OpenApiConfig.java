package com.rtdabe.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Right to Disconnect Automated Boundary Engine API")
                        .description("Enterprise HRMS middleware for enforcing Right to Disconnect laws")
                        .version("v1")
                        .contact(new Contact().name("RTD-ABE Platform Team")))
                .servers(List.of(new Server().url("http://localhost:8080")));
    }
}
