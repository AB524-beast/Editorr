from flask import Flask, render_template, request, redirect, url_for, send_file
import cv2
import os
from werkzeug.utils import secure_filename


app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'


os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


@app.route('/')
def login():
    return render_template('login.html')


@app.route('/signup')
def signup():
    return render_template('signup.html')


@app.route('/editor')
def editor():
    return render_template('editor.html')


@app.route('/logout')
def logout():
    # Simple logout that redirects to the login page. In a real app, clear session here.
    return redirect(url_for('login'))


@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return 'No image uploaded', 400
    file = request.files['image']
    action = request.form.get('action', 'grayscale')

    if file.filename == '':
        return 'No selected file', 400

    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    img = cv2.imread(input_path)
    if img is None:
        return 'Uploaded file is not a valid image', 400

    import time
    timestamp = int(time.time())

    if action == 'grayscale':
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        output_path = os.path.join(PROCESSED_FOLDER, f'output_{timestamp}.png')
        cv2.imwrite(output_path, gray)
        return send_file(output_path, as_attachment=True)
    elif action in ['png', 'jpg', 'webp']:
        ext = action
        output_path = os.path.join(PROCESSED_FOLDER, f'output_{timestamp}.{ext}')
        cv2.imwrite(output_path, img)
        return send_file(output_path, as_attachment=True)
    else:
        return 'Invalid action', 400


if __name__ == '__main__':
    app.run(debug=True)