from datetime import date
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.auth import current_user, hash_password, make_token, verify_password
from app.database import get_db
from app.models import Expense, Project, User


app = FastAPI(title="Construction Expense Tracker")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://construction-expense-tracker-nu.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Credentials(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=72)


class TokenOut(BaseModel):
    token: str


class ProjectIn(BaseModel):
    name: str
    location: str | None = None


class ProjectOut(ProjectIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ExpenseIn(BaseModel):
    category: str
    description: str | None = None
    amount: Decimal
    expense_date: date


class ExpenseOut(ExpenseIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int


class CategoryTotal(BaseModel):
    category: str
    total: Decimal


class ProjectSummary(BaseModel):
    project_id: int
    grand_total: Decimal
    by_category: list[CategoryTotal]


def get_my_project(db: Session, project_id: int, user: User) -> Project:
    project = db.get(Project, project_id)

    if project is None or project.owner_id != user.id:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


@app.get("/")
def home():
    return {"message": "Backend is running"}


@app.post("/register", response_model=TokenOut)
def register(
    data: Credentials,
    db: Session = Depends(get_db)
):
    if db.scalar(select(func.count(User.id))) > 0:
        raise HTTPException(
            status_code=403,
            detail="Registration is closed"
        )

    user = User(
        email=data.email.strip().lower(),
        password_hash=hash_password(data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    db.execute(
        update(Project)
        .where(Project.owner_id.is_(None))
        .values(owner_id=user.id)
    )

    db.commit()

    return TokenOut(token=make_token(user.id))


@app.post("/login", response_model=TokenOut)
def login(
    data: Credentials,
    db: Session = Depends(get_db)
):
    user = db.scalar(
        select(User).where(
            User.email == data.email.strip().lower()
        )
    )

    if user is None or not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Wrong email or password"
        )

    return TokenOut(token=make_token(user.id))


@app.get("/has-user")
def has_user(db: Session = Depends(get_db)):
    return {
        "has_user": db.scalar(
            select(func.count(User.id))
        ) > 0
    }


@app.post("/projects", response_model=ProjectOut)
def create_project(
    data: ProjectIn,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    project = Project(
        owner_id=user.id,
        **data.model_dump()
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@app.get("/projects", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    stmt = (
        select(Project)
        .where(Project.owner_id == user.id)
        .order_by(Project.id)
    )

    return db.scalars(stmt).all()


@app.post(
    "/projects/{project_id}/expenses",
    response_model=ExpenseOut
)
def add_expense(
    project_id: int,
    data: ExpenseIn,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    get_my_project(db, project_id, user)

    expense = Expense(
        project_id=project_id,
        **data.model_dump()
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@app.get(
    "/projects/{project_id}/expenses",
    response_model=list[ExpenseOut]
)
def list_expenses(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    get_my_project(db, project_id, user)

    stmt = (
        select(Expense)
        .where(Expense.project_id == project_id)
        .order_by(Expense.expense_date)
    )

    return db.scalars(stmt).all()


@app.get(
    "/projects/{project_id}/summary",
    response_model=ProjectSummary
)
def project_summary(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    get_my_project(db, project_id, user)

    total = func.sum(Expense.amount)

    stmt = (
        select(
            Expense.category,
            total.label("total")
        )
        .where(Expense.project_id == project_id)
        .group_by(Expense.category)
        .order_by(total.desc())
    )

    rows = db.execute(stmt).all()

    by_category = [
        CategoryTotal(
            category=r.category,
            total=r.total
        )
        for r in rows
    ]

    grand_total = sum(
        (c.total for c in by_category),
        Decimal("0")
    )

    return ProjectSummary(
        project_id=project_id,
        grand_total=grand_total,
        by_category=by_category
    )


@app.put(
    "/expenses/{expense_id}",
    response_model=ExpenseOut
)
def update_expense(
    expense_id: int,
    data: ExpenseIn,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    expense = db.get(Expense, expense_id)

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    get_my_project(
        db,
        expense.project_id,
        user
    )

    for key, value in data.model_dump().items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)

    return expense


@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user)
):
    expense = db.get(Expense, expense_id)

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    get_my_project(
        db,
        expense.project_id,
        user
    )

    db.delete(expense)
    db.commit()

    return {"ok": True}