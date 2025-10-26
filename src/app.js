const express = require("express");
const { swaggerUi, swaggerSpec, PORT } = require("./swagger_options");
const pool = require("./db");
const { setupMetrics, counters } = require("./metrics");

const app = express();
app.use(express.json());

setupMetrics(app); // configura métricas

app.get('/health', async (req, res) => {
  res.status(200).json({ status: "UP" });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Observability]
 *     summary: Health check
 *     description: Verifica o estado da API.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 */


// rota principal
app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//DAYCARE ENDPOINTS
/**
 * @swagger
 * /get_daycares:
 *   get:
 *     summary: Get all daycares
 *     tags:
 *       - Daycare
 *     description: Returns all daycare centers from the database.
 *     responses:
 *       200:
 *         description: List of all daycares
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 daycares_count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Happy Kids Daycare"
 *                       address:
 *                         type: string
 *                         example: "123 Sunshine St, Springfield"
 *                       phone:
 *                         type: string
 *                         example: "+1 555-123-4567"
 *                       email:
 *                         type: string
 *                         example: "info@happykids.com"
 *       500:
 *         description: Service error
 */
app.get("/get_daycares", async (req, res) => {
  try {
    const count = await pool.query(
      "SELECT COUNT(*) AS total_daycares FROM daycare"
    );
    const data = await pool.query("SELECT * FROM daycare ORDER BY id ASC");

    res.json({
      daycares_count: parseInt(count.rows[0].total_daycares, 10),
      data: data.rows,
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /get_daycare/{id}:
 *   get:
 *     summary: Get daycare by ID
 *     tags:
 *       - Daycare
 *     description: Retrieve a specific daycare record by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Successfully retrieved daycare record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Happy Kids Daycare"
 *                       address:
 *                         type: string
 *                         example: "123 Sunshine St, Springfield"
 *                       phone:
 *                         type: string
 *                         example: "+1 555-123-4567"
 *                       email:
 *                         type: string
 *                         example: "info@happykids.com"
 *       404:
 *         description: Daycare not found
 *       500:
 *         description: Internal server error
 */
app.get("/get_daycare/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM daycare WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "not_found",
        message: "Daycare not found",
      });
    }

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /delete_daycare/{id}:
 *   delete:
 *     summary: Delete daycare by ID
 *     tags:
 *       - Daycare
 *     description: Permanently removes a daycare record from the database using its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Daycare successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Daycare deleted successfully
 *       404:
 *         description: Daycare not found
 *       500:
 *         description: Internal server error
 */
app.delete("/delete_daycare/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM daycare WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "not_found",
        message: "Daycare not found",
      });
    }

    res.json({
      status: "success",
      message: "Daycare deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /update_daycare/{id}:
 *   put:
 *     summary: Update daycare by ID
 *     tags:
 *       - Daycare
 *     description: Updates an existing daycare record in the database by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bright Future Daycare"
 *               address:
 *                 type: string
 *                 example: "456 Rainbow Rd, Springfield"
 *               phone:
 *                 type: string
 *                 example: "+1 555-999-8888"
 *               email:
 *                 type: string
 *                 example: "contact@brightfuture.com"
 *     responses:
 *       200:
 *         description: Daycare updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Daycare updated successfully
 *                 updated_data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Bright Future Daycare"
 *                     address:
 *                       type: string
 *                       example: "456 Rainbow Rd, Springfield"
 *                     phone:
 *                       type: string
 *                       example: "+1 555-999-8888"
 *                     email:
 *                       type: string
 *                       example: "contact@brightfuture.com"
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Daycare not found
 *       500:
 *         description: Internal server error
 */
app.put("/update_daycare/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email } = req.body;

  if (!name || !address || !phone || !email) {
    return res.status(400).json({
      status: "error",
      message: "All fields (name, address, phone, email) are required",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE daycare
       SET name = $1, address = $2, phone = $3, email = $4
       WHERE id = $5
       RETURNING *`,
      [name, address, phone, email, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "not_found",
        message: "Daycare not found",
      });
    }

    res.json({
      status: "success",
      message: "Daycare updated successfully",
      updated_data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message,
    });
  }
});

// CLASSRROM ENDPOINTS
/**
 * @swagger
 * /get_classrooms:
 *   get:
 *     summary: Get all classrooms
 *     tags:
 *       - Classroom
 *     description: Returns all classrooms from the database.
 *     responses:
 *       200:
 *         description: List of classrooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classrooms_count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Preschool A"
 *                       daycare_id:
 *                         type: integer
 *                         example: 1
 *       500:
 *         description: Service error
 */
app.get("/get_classrooms", async (req, res) => {
  try {
    const count = await pool.query(
      "SELECT COUNT(*) AS total_classrooms FROM classroom"
    );
    const data = await pool.query("SELECT * FROM classroom ORDER BY id ASC");

    res.json({
      classrooms_count: parseInt(count.rows[0].total_classrooms, 10),
      data: data.rows,
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /get_classroom/{id}:
 *   get:
 *     summary: Get classroom by ID
 *     tags:
 *       - Classroom
 *     description: Retrieve a specific classroom record by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Classroom found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Preschool A"
 *                       daycare_id:
 *                         type: integer
 *                         example: 1
 *       404:
 *         description: Classroom not found
 *       500:
 *         description: Internal server error
 */
app.get("/get_classroom/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM classroom WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Classroom not found" });
    }

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /delete_classroom/{id}:
 *   delete:
 *     summary: Delete classroom by ID
 *     tags:
 *       - Classroom
 *     description: Permanently removes a classroom record from the database by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Classroom successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Classroom deleted successfully
 *       404:
 *         description: Classroom not found
 *       500:
 *         description: Internal server error
 */
app.delete("/delete_classroom/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM classroom WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Classroom not found" });
    }

    res.json({ status: "success", message: "Classroom deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /update_classroom/{id}:
 *   put:
 *     summary: Update classroom by ID
 *     tags:
 *       - Classroom
 *     description: Updates a classroom record in the database by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Preschool B"
 *               daycare_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Classroom updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Classroom updated successfully
 *                 updated_data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Preschool B"
 *                     daycare_id:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Classroom not found
 *       500:
 *         description: Internal server error
 */
app.put("/update_classroom/:id", async (req, res) => {
  const { id } = req.params;
  const { name, daycare_id } = req.body;

  if (!name || !daycare_id) {
    return res.status(400).json({
      status: "error",
      message: "Both name and daycare_id are required",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE classroom
       SET name = $1, daycare_id = $2
       WHERE id = $3
       RETURNING *`,
      [name, daycare_id, id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Classroom not found" });
    }

    res.json({
      status: "success",
      message: "Classroom updated successfully",
      updated_data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

//ENROLMENT ENDPOINTS
/**
 * @swagger
 * /get_enrollments:
 *   get:
 *     summary: get_enrollments check for the service
 *     tags:
 *       - Enrollment
 *     description: Returns the count "enrolnments" of the childs
 *     responses:
 *       200:
 *         description: Returns ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrollments_count:
 *                   type: int
 *                   example: 2
 *                 data:
 *                   type: object
 *                   example: {child_id: 1, parent_id: 1}
 *       500:
 *         description: Service error
 */
app.get("/get_enrollments", async (req, res) => {
  try {
    const count = await pool.query(
      "SELECT COUNT(*) AS total_enrollments FROM public.enrollment"
    );
    const data = await pool.query(
      "SELECT * FROM public.enrollment ORDER BY id ASC"
    );
    res.json({
      enrollments_count: count["rows"][0]["total_enrollments"],
      data: data["rows"],
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /get_enrollment/{id}:
 *   get:
 *     summary: Get enrollment by ID
 *     tags:
 *       - Enrollment
 *     description: Retrieve a specific enrollment record from the database by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique identifier of the enrollment record.
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Successfully retrieved enrollment record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       child_id:
 *                         type: integer
 *                         example: 3
 *                       parent_id:
 *                         type: integer
 *                         example: 5
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Internal server error
 */
app.get("/get_enrollment/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM public.enrollment WHERE public.enrollment.id=${id} ORDER BY id ASC`
    );
    if (result["rows"].length === 0) {
      return res.status(404).json({
        status: "not_found",
        message: "Enrollment not found",
      });
    }
    res.status(200).json({
      data: result["rows"],
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /delete_enrollment/{id}:
 *   delete:
 *     summary: Delete enrollment by ID
 *     tags:
 *       - Enrollment
 *     description: Permanently removes an enrollment record from the database using its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique identifier of the enrollment record to delete.
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Enrollment successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Enrollment deleted successfully
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Internal server error
 */
app.delete("/delete_enrollment/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `DELETE FROM public.enrollment WHERE public.enrollment.id=${id}`
    );

    res.status(200).json({
      status: "success",
      message: "Enrollment deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /update_enrollment/{id}:
 *   put:
 *     summary: Update enrollment by ID
 *     tags:
 *       - Enrollment
 *     description: Updates an existing enrollment record in the database by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique identifier of the enrollment record to update.
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               child_id:
 *                 type: integer
 *                 example: 0
 *               parent_id:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Enrollment updated successfully
 *                 updated_record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     child_id:
 *                       type: integer
 *                       example: 3
 *                     parent_id:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Internal server error
 */
app.put("/update_enrollment/:id", async (req, res) => {
  const { id } = req.params;
  const { child_id, parent_id } = req.body;

  if (!child_id || !parent_id) {
    return res.status(400).json({
      status: "error",
      message: "Both child_id and parent_id are required",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE public.enrollment
       SET child_id = ${child_id}, parent_id = ${parent_id}
       WHERE id = ${id}
       RETURNING *`
    );

    res.status(200).json({
      status: "success",
      message: "Enrollment updated successfully",
      updated_data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      error: err.message,
    });
  }
});

//CHILDREN ENDPOINTS
/**
 * @swagger
 * /get_children:
 *   get:
 *     summary: Get all children
 *     tags:
 *       - Child
 *     description: Returns all children in the database.
 *     responses:
 *       200:
 *         description: List of children
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 children_count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Emily Johnson"
 *                       date_of_birth:
 *                         type: string
 *                         format: date
 *                         example: "2020-05-12"
 *                       classroom_id:
 *                         type: integer
 *                         example: 1
 *                       daycare_id:
 *                         type: integer
 *                         example: 1
 *       500:
 *         description: Service error
 */
app.get("/get_children", async (req, res) => {
  try {
    const count = await pool.query(
      "SELECT COUNT(*) AS total_children FROM child"
    );
    const data = await pool.query("SELECT * FROM child ORDER BY id ASC");

    res.json({
      children_count: parseInt(count.rows[0].total_children, 10),
      data: data.rows,
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /get_child/{id}:
 *   get:
 *     summary: Get child by ID
 *     tags:
 *       - Child
 *     description: Retrieve a specific child record by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Child found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Emily Johnson"
 *                       date_of_birth:
 *                         type: string
 *                         format: date
 *                         example: "2020-05-12"
 *                       classroom_id:
 *                         type: integer
 *                         example: 1
 *                       daycare_id:
 *                         type: integer
 *                         example: 1
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
app.get("/get_child/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM child WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Child not found" });
    }

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /delete_child/{id}:
 *   delete:
 *     summary: Delete child by ID
 *     tags:
 *       - Child
 *     description: Permanently removes a child record from the database by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Child successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Child deleted successfully
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
app.delete("/delete_child/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM child WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Child not found" });
    }

    res.json({ status: "success", message: "Child deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /update_child/{id}:
 *   put:
 *     summary: Update child by ID
 *     tags:
 *       - Child
 *     description: Updates a child record by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Emily Johnson"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "2020-05-12"
 *               classroom_id:
 *                 type: integer
 *                 example: 1
 *               daycare_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Child updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Child updated successfully
 *                 updated_data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Emily Johnson"
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                       example: "2020-05-12"
 *                     classroom_id:
 *                       type: integer
 *                       example: 1
 *                     daycare_id:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
app.put("/update_child/:id", async (req, res) => {
  const { id } = req.params;
  const { name, date_of_birth, classroom_id, daycare_id } = req.body;

  if (!name || !date_of_birth || !classroom_id || !daycare_id) {
    return res
      .status(400)
      .json({ status: "error", message: "All fields are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE child
       SET name = $1, date_of_birth = $2, classroom_id = $3, daycare_id = $4
       WHERE id = $5
       RETURNING *`,
      [name, date_of_birth, classroom_id, daycare_id, id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Child not found" });
    }

    res.json({
      status: "success",
      message: "Child updated successfully",
      updated_data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

//PARENT ENDPOINTS
/**
 * @swagger
 * /get_parents:
 *   get:
 *     summary: Get all parents
 *     tags:
 *       - Parent
 *     description: Returns all parents in the database.
 *     responses:
 *       200:
 *         description: List of parents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parents_count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Alice Johnson"
 *                       phone:
 *                         type: string
 *                         example: "+1234567890"
 *                       email:
 *                         type: string
 *                         example: "alice@example.com"
 *       500:
 *         description: Service error
 */
app.get("/get_parents", async (req, res) => {
  try {
    const count = await pool.query(
      "SELECT COUNT(*) AS total_parents FROM parent"
    );
    const data = await pool.query("SELECT * FROM parent ORDER BY id ASC");

    res.json({
      parents_count: parseInt(count.rows[0].total_parents, 10),
      data: data.rows,
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /get_parent/{id}:
 *   get:
 *     summary: Get parent by ID
 *     tags:
 *       - Parent
 *     description: Retrieve a specific parent record by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Parent found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Alice Johnson"
 *                       phone:
 *                         type: string
 *                         example: "+1234567890"
 *                       email:
 *                         type: string
 *                         example: "alice@example.com"
 *       404:
 *         description: Parent not found
 *       500:
 *         description: Internal server error
 */
app.get("/get_parent/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM parent WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Parent not found" });
    }

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /delete_parent/{id}:
 *   delete:
 *     summary: Delete parent by ID
 *     tags:
 *       - Parent
 *     description: Permanently removes a parent record from the database by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Parent successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Parent deleted successfully
 *       404:
 *         description: Parent not found
 *       500:
 *         description: Internal server error
 */
app.delete("/delete_parent/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM parent WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Parent not found" });
    }

    res.json({ status: "success", message: "Parent deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/**
 * @swagger
 * /update_parent/{id}:
 *   put:
 *     summary: Update parent by ID
 *     tags:
 *       - Parent
 *     description: Updates a parent record by its unique ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Alice Johnson"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 example: "alice@example.com"
 *     responses:
 *       200:
 *         description: Parent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Parent updated successfully
 *                 updated_data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Alice Johnson"
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     email:
 *                       type: string
 *                       example: "alice@example.com"
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Parent not found
 *       500:
 *         description: Internal server error
 */
app.put("/update_parent/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;

  if (!name || !phone || !email) {
    return res
      .status(400)
      .json({ status: "error", message: "All fields are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE parent
       SET name = $1, phone = $2, email = $3
       WHERE id = $4
       RETURNING *`,
      [name, phone, email, id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Parent not found" });
    }

    res.json({
      status: "success",
      message: "Parent updated successfully",
      updated_data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.listen(3000, () =>
  console.log(`Server running on http://localhost:${PORT}/api`)
);
