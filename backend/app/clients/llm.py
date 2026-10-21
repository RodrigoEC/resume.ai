import os

from pydantic import BaseModel, Field
from langchain.chat_models import init_chat_model

from app.models.topic import JobExperiences


class AIClient(BaseModel):

    system_prompt: str = ""
    user_prompt: str = ""
    model_id: str = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
    model_provider: str = "bedrock_converse"
    llm_config: dict = Field(
        default_factory=lambda: {"region_name": os.getenv("AWS_REGION", "us-east-1")}
    )

    def invoke_llm(self, output_struct=None):
        llm = init_chat_model(
            self.model_id, model_provider=self.model_provider, **self.llm_config
        )
        so_kwargs = (
            {"method": "json_schema"} if self.model_provider == "huggingface" else {}
        )

        if output_struct:
            llm = llm.with_structured_output(output_struct, **so_kwargs)

        result = llm.invoke(
            [
                (
                    "system",
                    self.system_prompt,
                ),
                (
                    "user",
                    self.user_prompt,
                ),
            ]
        )
        return result
