var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
app.listen(3000, () => console.log("Server ready on port 3000."));
module.exports = router;
