package com.asiainfo.crm.security.demo.controller;

import com.asiainfo.crm.security.demo.dto.ReportResponse;
import com.asiainfo.crm.security.demo.framework.Result;
import com.asiainfo.crm.security.demo.service.ReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/report")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/generate")
    public Result<ReportResponse> generate(@RequestBody(required = false) Map<String, Object> params) {
        log.info("Generate assessment report");
        ReportResponse report = reportService.generateReport();
        return Result.success(report);
    }

    @PostMapping("/detail")
    public Result<ReportResponse> detail(@RequestBody Map<String, String> params) {
        String reportId = params.get("reportId");
        log.info("Get report detail, reportId={}", reportId);
        ReportResponse report = reportService.getReport(reportId);
        return Result.success(report);
    }
}
