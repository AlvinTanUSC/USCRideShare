package com.usc.rideshare.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);
    private HikariDataSource dataSource;

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Bean(destroyMethod = "close")
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        // Parse JDBC URL to extract username and password
        String cleanJdbcUrl = jdbcUrl;
        String username = null;
        String password = null;

        if (jdbcUrl.contains("?")) {
            String[] parts = jdbcUrl.split("\\?");
            cleanJdbcUrl = parts[0];
            String[] params = parts[1].split("&");

            for (String param : params) {
                String[] keyValue = param.split("=", 2);
                if (keyValue.length == 2) {
                    if ("user".equals(keyValue[0])) {
                        username = keyValue[1];
                    } else if ("password".equals(keyValue[0])) {
                        password = keyValue[1];
                    }
                }
            }
        }

        // Basic connection settings
        config.setJdbcUrl(cleanJdbcUrl);
        config.setDriverClassName("org.postgresql.Driver");

        if (username != null) {
            config.setUsername(username);
        }
        if (password != null) {
            config.setPassword(password);
        }

        // Connection pool settings - optimized for Supabase
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(0);  // Allow pool to drain to 0 on shutdown
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);  // 10 minutes
        config.setMaxLifetime(1800000);  // 30 minutes
        config.setPoolName("USCRideSharePool");

        // Connection leak detection
        config.setLeakDetectionThreshold(60000);  // 60 seconds

        // Ensure connections are valid before use
        config.setConnectionTestQuery("SELECT 1");
        config.setValidationTimeout(3000);

        // Auto-commit setting (Spring manages transactions)
        config.setAutoCommit(true);

        // Register MBeans for monitoring
        config.setRegisterMbeans(true);

        // PostgreSQL specific settings
        config.addDataSourceProperty("ApplicationName", "USCRideShare");
        config.addDataSourceProperty("socketTimeout", "30");
        config.addDataSourceProperty("loginTimeout", "10");
        config.addDataSourceProperty("connectTimeout", "10");
        config.addDataSourceProperty("tcpKeepAlive", "true");

        // Ensure connections close properly
        config.addDataSourceProperty("cancelSignalTimeout", "10");

        // Performance optimizations (PostgreSQL compatible)
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

        dataSource = new HikariDataSource(config);
        logger.info("HikariCP DataSource initialized with pool name: {}", config.getPoolName());

        return dataSource;
    }

    @PreDestroy
    public void closeDataSource() {
        if (dataSource != null && !dataSource.isClosed()) {
            logger.info("Shutting down HikariCP connection pool...");
            logger.info("Active connections: {}, Idle connections: {}, Total connections: {}",
                    dataSource.getHikariPoolMXBean().getActiveConnections(),
                    dataSource.getHikariPoolMXBean().getIdleConnections(),
                    dataSource.getHikariPoolMXBean().getTotalConnections());

            try {
                // Evict all idle connections first
                dataSource.getHikariPoolMXBean().softEvictConnections();
                logger.info("Evicted idle connections");

                // Give it a moment to evict
                Thread.sleep(500);

                // Close the pool completely
                dataSource.close();

                logger.info("HikariCP connection pool closed successfully");
            } catch (InterruptedException e) {
                logger.warn("Interrupted during connection eviction", e);
                Thread.currentThread().interrupt();
                dataSource.close();
            } catch (Exception e) {
                logger.error("Error closing HikariCP connection pool", e);
            }
        }
    }
}
