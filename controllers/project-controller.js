const bodyParser = require('body-parser');
const { Pool } = require('pg');
//const pool=require('../config/DBConnection')
const {generateGUID}=require('../utils/utils')
const {generateTimestamp}=require('../utils/utils')


const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });


// Function to handle project creation
const createProject = async (projectData) => {
    const result = await pool.query(
      'INSERT INTO project_data (domain, dept, project_program, justification, project_type, risk_impact_benefits, business_drivers_kpis, services_impacted, category, mission_alignment_statement, vendor, baseline_quantities, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [
        projectData.domain,
        projectData.dept,
        projectData.project_program,
        projectData.justification,
        projectData.project_type,
        projectData.risk_impact_benefits,
        projectData.business_drivers_kpis,
        projectData.services_impacted,
        projectData.category,
        projectData.mission_alignment_statement,
        projectData.vendor,
        projectData.baseline_quantities,
        projectData.currency,
      ]
    );
  
    return result.rows[0];
  };
  
  // Function to handle budget creation
  const createBudget = async (projectId, budgetData) => {
    const result = await pool.query(
      'INSERT INTO budget_data (project_id, fiscal_year, unit_price, qty, budget, early_load_percent, mind_the_gap, project_priority) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        projectId,
        budgetData.fiscal_year,
        budgetData.unit_price,
        budgetData.qty,
        budgetData.budget,
        budgetData.early_load_percent,
        budgetData.mind_the_gap,
        budgetData.project_priority,
      ]
    );
  
    return result.rows[0];
  };
  
  // Create Project and Budget Entry
  const createprojectandbudgetentry=async (req, res) => {
    const { projectData, budgetData } = req.body;
  
    try {
      const createdProject = await createProject(projectData);
      // Process each budget entry
    const createdBudget = [];
    for (const budgetEntry of budgetData) {

      console.log("Empty Check"+budgetEntry.fiscal_year!=null && budgetEntry.fiscal_year != "")
      if(budgetEntry.fiscal_year!=null && budgetEntry.fiscal_year != ""){
        const budgetResult = await createBudget(createdProject.id, budgetEntry);
        createdBudget.push(budgetResult);
      }
      
    }
  
      const response = {
        header: {
          requestRefId: generateGUID(),
          responseCode: 200,
          responseMessage: 'Project and Budget entry created successfully',
          customerMessage: '1',
          timestamp: generateTimestamp(),
        },
        body: [{ ...createdProject, budget: createdBudget }],
      };
  
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating project and budget entries:', error);
  
      const errorResponse = {
        header: {
          requestRefId: generateGUID(),
          responseCode: 500,
          responseMessage: 'Internal Server Error',
          customerMessage: 'An error occurred while creating the project and budget entries',
          timestamp: generateTimestamp(),
        },
        body: [],
      };
  
      res.status(500).json(errorResponse);
    }
  };

// Function to retrieve project details by project ID
const getProjectDetails = async (projectId) => {
    const result = await pool.query('SELECT * FROM project_data WHERE id = $1', [projectId]);
    return result.rows[0];
  };
  
  // Function to retrieve budget details by project ID
  const getBudgetDetails = async (projectId) => {
    const result = await pool.query('SELECT * FROM budget_data WHERE project_id = $1', [projectId]);
    return result.rows;
  };

  // API to retrieve project details and budget
const fetchBudgetDetails=async (req, res) => {
    const { projectId } = req.body;
  
    if (!projectId) {
      // Project ID is required
      res.status(400).json({
        header: {
          requestRefId: generateGUID(),
          responseCode: 400,
          responseMessage: 'Bad Request',
          customerMessage: 'Project ID is required in the request body',
          timestamp: generateTimestamp(),
        },
        body: [],
      });
      return;
    }
  
    try {
      // Retrieve project details
      const projectResult = await getProjectDetails(projectId);
  
      if (!projectResult) {
        // Project not found
        res.status(404).json({
          header: {
            requestRefId: generateGUID(),
            responseCode: 404,
            responseMessage: 'Project not found',
            customerMessage: 'Project with the specified ID not found',
            timestamp: generateTimestamp(),
          },
          body: [],
        });
        return;
      }
  
      // Retrieve budget details for the project
      const budgetResult = await getBudgetDetails(projectId);
  
      const response = {
        header: {
          requestRefId: generateGUID(),
          responseCode: 200,
          responseMessage: 'Project details and budget retrieved successfully',
          customerMessage: '1',
          timestamp: generateTimestamp(),
        },
        body: {
          project: projectResult,
          budget: budgetResult,
        },
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error('Error retrieving project details and budget:', error);
  
      const errorResponse = {
        header: {
          requestRefId: generateGUID(),
          responseCode: 500,
          responseMessage: 'Internal Server Error',
          customerMessage: 'An error occurred while retrieving project details and budget',
          timestamp: generateTimestamp(),
        },
        body: [],
      };
  
      res.status(500).json(errorResponse);
    }
  };

  const getAllProjects = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM project_data');
        const projects = result.rows;

        const response = {
            header: {
                requestRefId: generateGUID(),
                responseCode: 200,
                responseMessage: 'Projects retrieved successfully',
                customerMessage: '1',
                timestamp: generateTimestamp(),
            },
            body: projects,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error retrieving all projects:', error);

        const errorResponse = {
            header: {
                requestRefId: generateGUID(),
                responseCode: 500,
                responseMessage: 'Internal Server Error',
                customerMessage: 'An error occurred while retrieving all projects',
                timestamp: generateTimestamp(),
            },
            body: [],
        };

        res.status(500).json(errorResponse);
    }
};


const getAllProjectTypes = async (req, res) => {
  try {
      // Assuming your project type column is named 'projecttype' in the 'project_data' table
      const result = await pool.query('SELECT DISTINCT projecttype FROM projecttype');
      const projectTypes = result.rows.map(row => row.projecttype);

      const response = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 200,
              responseMessage: 'Project types retrieved successfully',
              customerMessage: '1',
              timestamp: generateTimestamp(),
          },
          body: projectTypes,
      };

      res.status(200).json(response);
  } catch (error) {
      console.error('Error retrieving project types:', error);

      const errorResponse = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 500,
              responseMessage: 'Internal Server Error',
              customerMessage: 'An error occurred while retrieving project types',
              timestamp: generateTimestamp(),
          },
          body: [],
      };

      res.status(500).json(errorResponse);
  }
};

const getImpactedServices = async (req, res) => {
  try {
      // Assuming your project type column is named 'projecttype' in the 'project_data' table
      const result = await pool.query('SELECT DISTINCT services FROM servicesimpacted');
      const impactedServices = result.rows.map(row => row.services);

      const response = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 200,
              responseMessage: 'Impacted Services retrieved successfully',
              customerMessage: '1',
              timestamp: generateTimestamp(),
          },
          body: impactedServices,
      };

      res.status(200).json(response);
  } catch (error) {
      console.error('Error retrieving impactedservices:', error);

      const errorResponse = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 500,
              responseMessage: 'Internal Server Error',
              customerMessage: 'An error occurred while retrieving impacted services',
              timestamp: generateTimestamp(),
          },
          body: [],
      };

      res.status(500).json(errorResponse);
  }
};

const getCategories = async (req, res) => {
  try {
      // Assuming your project type column is named 'projecttype' in the 'project_data' table
      const result = await pool.query('SELECT DISTINCT category FROM category');
      const categories = result.rows.map(row => row.category);

      const response = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 200,
              responseMessage: 'Categories retrieved successfully',
              customerMessage: '1',
              timestamp: generateTimestamp(),
          },
          body: categories,
      };

      res.status(200).json(response);
  } catch (error) {
      console.error('Error retrieving categories:', error);

      const errorResponse = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 500,
              responseMessage: 'Internal Server Error',
              customerMessage: 'An error occurred while retrieving categories',
              timestamp: generateTimestamp(),
          },
          body: [],
      };

      res.status(500).json(errorResponse);
  }
};

const getDomains = async (req, res) => {
  try {
      // Assuming your project type column is named 'projecttype' in the 'project_data' table
      const result = await pool.query('SELECT DISTINCT domain FROM domainnames');
      const domains = result.rows.map(row => row.domain);

      const response = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 200,
              responseMessage: 'Domains retrieved successfully',
              customerMessage: '1',
              timestamp: generateTimestamp(),
          },
          body: domains,
      };

      res.status(200).json(response);
  } catch (error) {
      console.error('Error retrieving domains:', error);

      const errorResponse = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 500,
              responseMessage: 'Internal Server Error',
              customerMessage: 'An error occurred while retrieving domains',
              timestamp: generateTimestamp(),
          },
          body: [],
      };

      res.status(500).json(errorResponse);
  }
};

const getDepartments = async (req, res) => {
  try {
      // Assuming your project type column is named 'projecttype' in the 'project_data' table
      const result = await pool.query('SELECT DISTINCT departments FROM departments');
      const departments = result.rows.map(row => row.departments);

      const response = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 200,
              responseMessage: 'Departments retrieved successfully',
              customerMessage: '1',
              timestamp: generateTimestamp(),
          },
          body: departments,
      };

      res.status(200).json(response);
  } catch (error) {
      console.error('Error retrieving departments:', error);

      const errorResponse = {
          header: {
              requestRefId: generateGUID(),
              responseCode: 500,
              responseMessage: 'Internal Server Error',
              customerMessage: 'An error occurred while retrieving departments',
              timestamp: generateTimestamp(),
          },
          body: [],
      };

      res.status(500).json(errorResponse);
  }
};

const getProjectList = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        project_data.id,
        project_data.dept,
        project_data.project_program,
        budget_data.status,
        budget_data.fiscal_year
      FROM
        project_data
      INNER JOIN
        budget_data ON project_data.id = budget_data.project_id
    `);

    const projects = result.rows;

    const response = {
      header: {
        requestRefId: generateGUID(),
        responseCode: 200,
        responseMessage: 'Projects retrieved successfully',
        customerMessage: '1',
        timestamp: generateTimestamp(),
      },
      body: projects,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving all projects:', error);

    const errorResponse = {
      header: {
        requestRefId: generateGUID(),
        responseCode: 500,
        responseMessage: 'Internal Server Error',
        customerMessage: 'An error occurred while retrieving all projects',
        timestamp: generateTimestamp(),
      },
      body: [],
    };

    res.status(500).json(errorResponse);
  }
};




  

  module.exports={
    createprojectandbudgetentry,
    fetchBudgetDetails,
    getAllProjects,
    getAllProjectTypes,
    getImpactedServices,
    getCategories,
    getDomains,
    getDepartments,
    getProjectList,
  }
  
  
  
