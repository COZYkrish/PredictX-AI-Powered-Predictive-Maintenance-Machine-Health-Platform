from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel

T = TypeVar("T")

class Pagination(BaseModel):
    page: int
    page_size: int
    total: int

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: Pagination

class ErrorResponseModel(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorResponseModel
