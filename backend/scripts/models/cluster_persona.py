"""
Pydantic models for Cluster Proto-Persona validation.
Matches the Socratic Prompting JSON structure.
"""

from typing import List, Optional, Any
from pydantic import BaseModel, Field, model_validator


class ConfidenceField(BaseModel):
    """Generic field with value, confidence, and validation support."""
    value: Any = Field(default="")
    confidence: str = Field(default="Medium", description="High | Medium | Low")
    support_count: int = Field(default=0, description="Number of users matching this attribute")


class PersonaTitle(BaseModel):
    persona_name: str = ""
    tagline: str = ""
    user_profiles: int = 0
    confidence_level: str = "Medium"

    @model_validator(mode='after')
    def check_name(self) -> 'PersonaTitle':
        if not self.persona_name:
            raise ValueError("Persona name cannot be empty")
        return self


class PersonaDemographics(BaseModel):
    age_distribution: ConfidenceField = Field(default_factory=lambda: ConfidenceField(value="Unknown"))
    gender_distribution: ConfidenceField = Field(default_factory=lambda: ConfidenceField(value="Unknown"))
    occupation: ConfidenceField = Field(default_factory=lambda: ConfidenceField(value="Unknown"))
    nationality_background: Optional[ConfidenceField] = Field(default_factory=lambda: ConfidenceField(value="Unknown"))
    location: Optional[ConfidenceField] = Field(default_factory=lambda: ConfidenceField(value="Unknown"))
    living_situation: Optional[ConfidenceField] = Field(default_factory=lambda: ConfidenceField(value="Unknown"))
    education: Optional[ConfidenceField] = Field(default_factory=lambda: ConfidenceField(value="Unknown"))

    @model_validator(mode='after')
    def check_unknowns(self) -> 'PersonaDemographics':
        """
        Ensure data quality by rejecting models with too many unknown values.
        Rule: Allow at most 1 'Unknown' value across all demographic fields.
        More than 1 indicates a corrupted or low-quality generation.
        """
        unknown_count = 0
        unknown_fields = []
        
        # Iterate over all defined fields in this model
        for field_name in self.model_fields.keys():
            field_obj = getattr(self, field_name)
            
            # Check if field is present and has a 'value' attribute (ConfidenceField)
            if field_obj and hasattr(field_obj, 'value'):
                val = str(field_obj.value).strip().lower()
                if val in ["unknown", "", "n/a"]:
                    unknown_count += 1
                    unknown_fields.append(field_name)
        
        if unknown_count > 1:
            raise ValueError(
                f"Too many unknown fields ({unknown_count}): {', '.join(unknown_fields)}. "
                "Max allowed is 1. Rerunning generation."
            )
            
        return self


class PersonaPsychographics(BaseModel):
    goals: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    confidence: str = "Medium"


class PersonaShoppingBehavior(BaseModel):
    frequency: ConfidenceField = Field(default_factory=lambda: ConfidenceField(value="Weekly"))
    preferred_devices: List[str] = Field(default_factory=list)
    preferred_categories: List[str] = Field(default_factory=list)
    search_style: ConfidenceField = Field(default_factory=lambda: ConfidenceField(value=""))
    decision_style: ConfidenceField = Field(default_factory=lambda: ConfidenceField(value=""))
    pain_points: List[str] = Field(default_factory=list)
    confidence: str = "Medium"


class ClusterPersona(BaseModel):
    """Complete cluster proto-persona structure (Socratic Method)."""
    title: PersonaTitle = Field(default_factory=PersonaTitle)
    demographics: PersonaDemographics = Field(default_factory=PersonaDemographics)
    psychographics: PersonaPsychographics = Field(default_factory=PersonaPsychographics)
    shopping_behavior: PersonaShoppingBehavior = Field(default_factory=PersonaShoppingBehavior)
    narrative: str = ""
