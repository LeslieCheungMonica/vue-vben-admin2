package com.asiainfo.crm.security.demo.framework;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public Result<?> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("Illegal argument: {}", e.getMessage());
        return Result.failure(400, e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public Result<?> handleIllegalStateException(IllegalStateException e) {
        log.warn("Illegal state: {}", e.getMessage());
        return Result.failure(1, e.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public Result<?> handleRuntimeException(RuntimeException e) {
        log.error("Runtime exception: {}", e.getMessage(), e);
        return Result.failure(500, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        log.error("Unexpected exception: {}", e.getMessage(), e);
        return Result.failure(500, "Internal server error");
    }
}
