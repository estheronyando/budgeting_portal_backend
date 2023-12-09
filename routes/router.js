const express = require("express");
 
const {
    signup,
    isExistPhone,
    authentication,
    login,
    loginWithMobileNumber,
    logout,
    updateUserInfo,
  } = require("../controllers/user-controller");
 
  const {
    createprojectandbudgetentry,
    fetchBudgetDetails,
    getAllProjects,
    getAllProjectTypes,
    getImpactedServices,
    getCategories,
    getDomains,
    getDepartments,
    getProjectList,
  } = require("../controllers/project-controller");
 
 
  //User Account related routes
const router = express.Router();
 
router.post("/accounts/signup", signup);
router.post("/accounts/login", login);
router.post("/accounts/login-with-phone", loginWithMobileNumber);
router.post("/accounts/check-phone", isExistPhone);
router.get("/accounts/authentication", authentication);
router.get("/accounts/logout", logout);
router.patch("/accounts/update-user-info", updateUserInfo);
// router.patch("/accounts/update-email", updateEmail);
 
 
//Project and Budget related routes
router.post('/projects',createprojectandbudgetentry); 
router.post('/projects/details',fetchBudgetDetails)
router.post('/allprojects',getAllProjects)
router.get('/projecttypes',getAllProjectTypes)
router.get('/impactedservices',getImpactedServices)
router.get('/categories',getCategories)
router.get('/domains',getDomains)
router.get('/departments',getDepartments)
router.get('/projectlist',getProjectList)
 
module.exports = router;