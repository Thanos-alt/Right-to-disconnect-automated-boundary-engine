package com.rtdabe.service.impl;

import com.rtdabe.dto.EmployeeRequest;
import com.rtdabe.dto.EmployeeResponse;
import com.rtdabe.entity.Employee;
import com.rtdabe.repository.EmployeeRepository;
import com.rtdabe.service.EmployeeService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {
    private final EmployeeRepository employeeRepository;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    public EmployeeResponse create(EmployeeRequest request) {
        Employee employee = new Employee();
        employee.setEmployeeCode(request.employeeCode());
        employee.setFullName(request.fullName());
        employee.setEmail(request.email());
        employee.setDepartment(request.department());
        employee.setCountryCode(request.countryCode());
        employee.setTimezone(request.timezone());
        employee.setContractType(request.contractType());
        Employee saved = employeeRepository.save(employee);
        return map(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> list() {
        return employeeRepository.findAll().stream().map(this::map).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse findByCode(String employeeCode) {
        return employeeRepository.findByEmployeeCode(employeeCode).map(this::map)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
    }

    private EmployeeResponse map(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getCountryCode(),
                employee.getTimezone(),
                employee.getContractType(),
                employee.isActive(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }
}
