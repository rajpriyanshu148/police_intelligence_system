@echo off
echo ===========================================================
echo       POLICE INTELLIGENCE SYSTEM ENVIRONMENT SETUP
echo ===========================================================

cd ..

echo [1/4] Creating Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo Error creating virtual environment. Please ensure Python is installed and added to PATH.
    pause
    exit /b %errorlevel%
)

echo [2/4] Activating environment and installing requirements...
call .\venv\Scripts\activate
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing dependencies.
    pause
    exit /b %errorlevel%
)

echo [3/4] Generating synthetic multi-task instruction dataset...
python -m src.training.generate_dataset
if %errorlevel% neq 0 (
    echo Error generating dataset.
    pause
    exit /b %errorlevel%
)

echo [4/4] Seeding database and generating FAISS vector index...
python -c "import sys; sys.path.append('.'); from src.database.connection import init_db; init_db(); from src.vector_store.faiss_store import vector_store; vector_store.build_index()"
if %errorlevel% neq 0 (
    echo Error seeding index.
    pause
    exit /b %errorlevel%
)

echo ===========================================================
echo SETUP COMPLETED SUCCESSFULLY!
echo ===========================================================
echo To start the backend and frontend dashboard, run:
echo   venv\Scripts\activate
echo   python -m src.api.main
echo Then open your browser and navigate to: http://127.0.0.1:8000/
echo ===========================================================
pause
