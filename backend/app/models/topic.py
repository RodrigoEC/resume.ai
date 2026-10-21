from pydantic import BaseModel, Field

class Topic(BaseModel):
    """Structured topics that describes an experience of a job position using STAR method."""

    company: str = Field(
        description="Company where I worked in on this Topic",
        examples=["LBCA", "ePol", "NuFuturo"],
    )
    situation: str = Field(
        description="The context. What was going on, and what was the problem or need?",
        examples=[
            "Every new client project required rebuilding the document intake logic from scratch."
        ],
    )
    task: str = Field(
        description="your responsibility in that situation. What were you expected to achieve?",
        examples=[
            "Build a reusable service to extract structured data from any document."
        ],
    )
    action: list[str] = Field(
        description="what you specifically did. This is usually the longest part, focused on your decisions, tools, and approach.",
        examples=[
            "Built an OCR + LLM extraction pipeline with AWS Textract and Bedrock, integrated via Kafka."
        ],
    )
    result: str = Field(
        description="the outcome, ideally measurable. What changed because of your work?",
        examples=[
            "The service is now reused across multiple systems, eliminating rework on new projects."
        ],
    )

class JobExperiences(BaseModel):
    """List of job experiences topics"""
    topics: list[Topic] = Field(description="List of STAR topics for the current job")