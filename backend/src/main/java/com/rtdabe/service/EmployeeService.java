package com.rtdabe.service;

import com.rtdabe.dto.EmployeeRequest;
import com.rtdabe.dto.EmployeeResponse;
import java.util.List;

public interface EmployeeService {
    EmployeeResponse create(EmployeeRequest request);
    List<EmployeeResponse> list();
    EmployeeResponse findByCode(String employeeCode);
}
