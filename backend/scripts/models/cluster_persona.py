"""
Pydantic models for Cluster Proto-Persona validation.
Matches the cluster_persona.txt JSON structure.
"""

from pydantic import BaseModel, Field, model_validator


# Demographics Field Models
class AgeDistribution(BaseModel):
    value: str = Field(default="Unknown", description="Age range, e.g., '25-34 years old'")
    num_of_users_in_this_age: int = Field(default=0)


class GenderDistribution(BaseModel):
    value: str = Field(default="Unknown", description="Male or Female")
    num_of_users_of_this_gender: int = Field(default=0)


class NationalityBackground(BaseModel):
    value: str = Field(default="Unknown", description="Single nationality")
    num_of_users_from_with_this_nationality: int = Field(default=0)


class LocationPattern(BaseModel):
    value: str = Field(default="Unknown", description="Single city or area")
    num_of_users_with_same_location_pattern: int = Field(default=0)


class LivingSituation(BaseModel):
    value: str = Field(default="Unknown", description="Alone, With Partner, With Family, etc.")
    num_of_users_with_this_living_situation_pattern: int = Field(default=0)


class Occupation(BaseModel):
    value: str = Field(default="Unknown", description="Single occupation")
    num_of_users_with_same_occupation_type: int = Field(default=0)


class EducationLevel(BaseModel):
    value: str = Field(default="Unknown", description="Single education level")
    num_of_users_with_same_education_level: int = Field(default=0)


# Shopping Behavior Field Models 
class FrequencyPattern(BaseModel):
    value: str = Field(default="Weekly", description="Daily, Weekly, Monthly, Rarely")
    num_of_users_with_this_frequency: int = Field(default=0)


class PersonaTitle(BaseModel):
    persona_name: str = ""
    tagline: str = ""
    user_profiles: int = 0

    @model_validator(mode='after')
    def check_name(self) -> 'PersonaTitle':
        if not self.persona_name:
            raise ValueError("Persona name cannot be empty")
        return self


class PersonaDemographics(BaseModel):
    age_distribution: AgeDistribution = Field(default_factory=AgeDistribution)
    gender_distribution: GenderDistribution = Field(default_factory=GenderDistribution)
    nationality_background: NationalityBackground = Field(default_factory=NationalityBackground)
    location_pattern: LocationPattern = Field(default_factory=LocationPattern)
    living_situation: LivingSituation = Field(default_factory=LivingSituation)
    occupation: Occupation = Field(default_factory=Occupation)
    education_level: EducationLevel = Field(default_factory=EducationLevel)

    @model_validator(mode='after')
    def check_unknowns(self) -> 'PersonaDemographics':
        """
        Ensure data quality by rejecting models with too many unknown values.
        Rule: Allow at most 1 'Unknown' value across all demographic fields.
        """
        unknown_count = 0
        unknown_fields = []

        for field_name in self.model_fields.keys():
            field_obj = getattr(self, field_name)
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
    goals: list[str] = []
    interests: list[str] = []
    values: list[str] = []


class PersonaShoppingBehavior(BaseModel):
    frequency_pattern: FrequencyPattern = Field(default_factory=FrequencyPattern)
    preferred_devices: list[str] = []
    search_style: str = ""
    price_sensitivity: str = ""
    decision_style: str = ""
    preferred_categories: list[str] = []
    common_pain_points: list[str] = []


class ClusterPersona(BaseModel):
    """Complete cluster proto-persona structure (matches cluster_persona.txt)."""
    title: PersonaTitle = Field(default_factory=PersonaTitle)
    demographics: PersonaDemographics = Field(default_factory=PersonaDemographics)
    psychographics: PersonaPsychographics = Field(default_factory=PersonaPsychographics)
    shopping_behavior: PersonaShoppingBehavior = Field(default_factory=PersonaShoppingBehavior)
    narrative: str = ""
