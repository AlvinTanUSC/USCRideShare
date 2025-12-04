package com.usc.rideshare.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class ShutdownListener implements ApplicationListener<ContextClosedEvent> {

    private static final Logger logger = LoggerFactory.getLogger(ShutdownListener.class);
    private final DataSource dataSource;

    public ShutdownListener(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void onApplicationEvent(ContextClosedEvent event) {
        logger.info("Application shutdown initiated - closing database connections...");

        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
            if (!hikariDataSource.isClosed()) {
                try {
                    logger.info("Closing HikariCP pool: {}", hikariDataSource.getPoolName());

                    // Log current connection state
                    var poolMXBean = hikariDataSource.getHikariPoolMXBean();
                    logger.info("Before close - Active: {}, Idle: {}, Total: {}, Awaiting: {}",
                            poolMXBean.getActiveConnections(),
                            poolMXBean.getIdleConnections(),
                            poolMXBean.getTotalConnections(),
                            poolMXBean.getThreadsAwaitingConnection());

                    // Evict idle connections first
                    poolMXBean.softEvictConnections();
                    logger.info("Evicted idle connections");

                    // Wait briefly for eviction
                    Thread.sleep(1000);

                    // Force close
                    hikariDataSource.close();
                    logger.info("HikariCP pool closed successfully");
                } catch (InterruptedException e) {
                    logger.warn("Interrupted during shutdown", e);
                    Thread.currentThread().interrupt();
                } catch (Exception e) {
                    logger.error("Error closing HikariCP pool during shutdown", e);
                }
            } else {
                logger.info("HikariCP pool already closed");
            }
        }
    }
}
