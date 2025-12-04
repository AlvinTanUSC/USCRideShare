package com.usc.rideshare.controller;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/db")
    public Map<String, Object> getDatabaseHealth() {
        Map<String, Object> health = new HashMap<>();

        try {
            if (dataSource instanceof HikariDataSource) {
                HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
                HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();

                health.put("status", "UP");
                health.put("poolName", hikariDataSource.getPoolName());
                health.put("activeConnections", poolMXBean.getActiveConnections());
                health.put("idleConnections", poolMXBean.getIdleConnections());
                health.put("totalConnections", poolMXBean.getTotalConnections());
                health.put("threadsAwaitingConnection", poolMXBean.getThreadsAwaitingConnection());
                health.put("maximumPoolSize", hikariDataSource.getMaximumPoolSize());
                health.put("minimumIdle", hikariDataSource.getMinimumIdle());
            } else {
                health.put("status", "UP");
                health.put("info", "DataSource is not HikariCP");
            }

            // Test connection
            try (var connection = dataSource.getConnection()) {
                health.put("connectionTest", "SUCCESS");
                health.put("databaseProductName", connection.getMetaData().getDatabaseProductName());
                health.put("databaseProductVersion", connection.getMetaData().getDatabaseProductVersion());
            }

        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
        }

        return health;
    }

    @GetMapping("/ping")
    public Map<String, String> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return response;
    }
}
