from flask import Flask, render_template, request, redirect, url_for
import mysql.connector

app = Flask(__name__)

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="reeper(_)09",
    database="stu_management"
)

def get_cursor(dictionary=False):
    db.ping(reconnect=True, attempts=3, delay=1)
    return db.cursor(dictionary=dictionary)

@app.route('/')
def dashboard():
    cursor = get_cursor(dictionary=True)

    # total students kitne hain
    cursor.execute("SELECT COUNT(*) AS total FROM students")
    result = cursor.fetchone()
    total_students = result['total']

    # active students kitne hain
    cursor.execute("SELECT COUNT(*) AS total FROM students WHERE status = 'active'")
    result = cursor.fetchone()
    active_students = result['total']

    # is mahine ke naye students kitne hain
    cursor.execute("SELECT COUNT(*) AS total FROM students WHERE MONTH(created_at) = MONTH(CURDATE())")
    result = cursor.fetchone()
    new_students = result['total']

    # total kitni classes hain
    cursor.execute("SELECT COUNT(*) AS total FROM classes")
    result = cursor.fetchone()
    total_classes = result['total']

    # har class mein kitne students hain
    cursor.execute("SELECT class_name AS name, COUNT(*) AS count FROM students GROUP BY class_name")
    class_rows = cursor.fetchall()

    students_by_class = []

    for row in class_rows:

        percentage = 0

        if total_students > 0:
            percentage = (row['count'] / total_students) * 100

        students_by_class.append({
        'name': row['name'],
        'count': row['count'],
        'percent': percentage
        })
    cursor.close()

    return render_template(
        'dashboard.html',
        total_students=total_students,
        active_students=active_students,
        new_students=new_students,
        total_classes=total_classes,
        students_by_class=students_by_class
    )

@app.route('/students')
def students():

    cursor = get_cursor(dictionary=True)

    query = """
        SELECT id, name, email, phone, gender, class_name, age
        FROM students
        ORDER BY id
    """

    cursor.execute(query)
    students_data = cursor.fetchall()
    cursor.close()

    return render_template('students.html', students=students_data)

@app.route('/students/add', methods=['GET', 'POST'])
def add_student():

    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        gender = request.form['gender']
        class_name = request.form['class_name']
        age = request.form['age']
        address = request.form['address']

        cursor = get_cursor()

        query = """
            INSERT INTO students (name, email, phone, gender, class_name, age, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (name, email, phone, gender, class_name, age, address)

        cursor.execute(query, values)
        db.commit()
        cursor.close()

        return redirect(url_for('students'))

    return render_template('add_students.html')

@app.route('/students/<int:student_id>')
def student_details(student_id):
    cursor = get_cursor(dictionary=True)

    cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
    student = cursor.fetchone()

    cursor.close()

    return render_template('student_details.html', student=student)

@app.route('/students/<int:student_id>/edit', methods=['GET', 'POST'])
def edit_student(student_id):
    cursor = get_cursor(dictionary=True)

    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        gender = request.form['gender']
        class_name = request.form['class_name']
        age = request.form['age']
        address = request.form['address']

        query = """
            UPDATE students
            SET name = %s, email = %s, phone = %s, gender = %s, class_name = %s, age = %s, address = %s
            WHERE id = %s
        """
        values = (name, email, phone, gender, class_name, age, address, student_id)

        cursor.execute(query, values)
        db.commit()
        cursor.close()

        return redirect(url_for('student_details', student_id=student_id))

    # GET request — purana data nikal kar form mein bhar do
    cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
    student = cursor.fetchone()
    cursor.close()

    return render_template('edit_student.html', student=student)

@app.route('/students/<int:student_id>/delete', methods=['POST'])
def delete_student(student_id):
    cursor = get_cursor()
    cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
    db.commit()
    cursor.close()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)