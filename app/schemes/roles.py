from pydantic import BaseModel

from app.schemes.users import SUserGet


class SRolesAdd(BaseModel):
    title: str


class SRoleGet(SRolesAdd):
    id: int


class SRoleGetWithRels(SRoleGet):
    users: list[SUserGet]
