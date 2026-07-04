package com.rtdabe.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;

@Configuration
@EnableKafka
public class KafkaConfig {
    @Bean
    public NewTopic messageTopic(@Value("${rtdabe.kafka.message-topic}") String topicName) {
        return new NewTopic(topicName, 1, (short) 1);
    }

    @Bean
    public NewTopic complianceTopic(@Value("${rtdabe.kafka.compliance-topic}") String topicName) {
        return new NewTopic(topicName, 1, (short) 1);
    }
}
