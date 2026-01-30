"""
Pydantic models for Cluster Persona validation.
Ensures LLM responses match the expected structure.
"""

from pydantic import BaseModel


class CountField(BaseModel):
    value: str = ""
    num_of_users_in_this_age: int | str = 0


class GenderDistribution(BaseModel):
    value: str = ""
    num_of_users_of_this_gender: int | str = 0


class NationalityField(BaseModel):
    value: str = ""
    num_of_users_from_with_this_nationality: int | str = 0


class LocationField(BaseModel):
    value: str = ""
    num_of_users_with_same_location_pattern: int | str = 0


class LivingSituationField(BaseModel):
    value: str = ""
    num_of_users_with_this_living_situation_pattern: int | str = 0


class OccupationField(BaseModel):
    value: str = ""
    num_of_users_with_same_occupation_type: int | str = 0


class EducationField(BaseModel):
    value: str = ""
    num_of_users_with_same_education_level: int | str = 0


class FrequencyField(BaseModel):
    value: str = ""
    num_of_users_with_this_frequency: int | str = 0


class PersonaTitle(BaseModel):
    persona_name: str = ""
    tagline: str = ""
    user_profiles: int | str = 0


class PersonaDemographics(BaseModel):
    age_distribution: CountField = CountField()
    gender_distribution: GenderDistribution = GenderDistribution()
    nationality_background: NationalityField = NationalityField()
    location_pattern: LocationField = LocationField()
    living_situation: LivingSituationField = LivingSituationField()
    occupation: OccupationField = OccupationField()
    education_level: EducationField = EducationField()


class PersonaPsychographics(BaseModel):
    goals: list[str] = []
    interests: list[str] = []
    values: list[str] = []


class PersonaShoppingBehavior(BaseModel):
    frequency_pattern: FrequencyField = FrequencyField()
    preferred_devices: list[str] = []
    search_style: str = ""
    price_sensitivity: str = ""
    decision_style: str = ""
    preferred_categories: list[str] = []
    common_pain_points: list[str] = []


class ClusterPersona(BaseModel):
    """Complete cluster persona structure for LLM synthesis."""
    title: PersonaTitle = PersonaTitle()
    demographics: PersonaDemographics = PersonaDemographics()
    psychographics: PersonaPsychographics = PersonaPsychographics()
    shopping_behavior: PersonaShoppingBehavior = PersonaShoppingBehavior()
    narrative: str = ""
