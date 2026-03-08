package com.consumerordering.plancatalogservice.config;

import com.consumerordering.plancatalogservice.model.Plan;
import com.consumerordering.plancatalogservice.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final PlanRepository planRepository;

    @Override
    public void run(String... args) {
        if (planRepository.count() > 0) {
            log.info("Plans table already has data — skipping seed");
            return;
        }

        log.info("Seeding plans table with default plans...");

        List<Plan> plans = List.of(
            Plan.builder()
                .planId("basic")
                .name("Basic")
                .description("Perfect for light users who mostly use Wi-Fi")
                .pricePerMonth(35)
                .dataGB(5)
                .features(List.of(
                    "Unlimited talk & text",
                    "5G access",
                    "5 GB high-speed data",
                    "Mexico & Canada included"
                ))
                .sortOrder(1)
                .shortTagline("Perfect for light users")
                .build(),

            Plan.builder()
                .planId("standard")
                .name("Standard")
                .description("Great for everyday use with plenty of data")
                .pricePerMonth(55)
                .dataGB(15)
                .features(List.of(
                    "Unlimited talk & text",
                    "5G Ultra Wideband",
                    "15 GB high-speed data",
                    "Disney+ Basic included",
                    "Mexico & Canada included"
                ))
                .sortOrder(2)
                .badge("Most Popular")
                .shortTagline("Great balance of data & value")
                .build(),

            Plan.builder()
                .planId("premium")
                .name("Premium")
                .description("Our best plan for power users and streamers")
                .pricePerMonth(75)
                .dataGB(50)
                .features(List.of(
                    "Unlimited talk & text",
                    "5G Ultra Wideband",
                    "50 GB premium data",
                    "Disney+, Hulu, ESPN+ included",
                    "25 GB mobile hotspot",
                    "International texting"
                ))
                .sortOrder(3)
                .badge("Best Value")
                .shortTagline("For power users & streamers")
                .build(),

            Plan.builder()
                .planId("unlimited")
                .name("Unlimited Plus")
                .description("Truly unlimited with no compromises")
                .pricePerMonth(90)
                .dataGB(-1)
                .features(List.of(
                    "Unlimited talk & text",
                    "5G Ultra Wideband",
                    "Unlimited premium data",
                    "Disney+, Hulu, ESPN+, Apple Music",
                    "50 GB mobile hotspot",
                    "International calling & texting",
                    "Smartwatch & tablet plan included"
                ))
                .sortOrder(4)
                .shortTagline("No limits, no worries")
                .build()
        );

        plans.forEach(planRepository::save);
        log.info("Seeded {} plans", plans.size());
    }
}
