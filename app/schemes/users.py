from pydantic import BaseModel, ConfigDict, EmailStr


class SUserAddRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int


class SUserAdd(BaseModel):
    name: str
    email: EmailStr
    hashed_password: str
    role_id: int


class SUserAuth(BaseModel):
    email: EmailStr
    password: str


class SUserGet(SUserAdd):
    id: int
