"""
Pydantic models for User Profile validation.
Ensures LLM responses match the expected structure.
"""

from pydantic import BaseModel


class ConfidenceField(BaseModel):
    value: str | list[str] | None = None
    confidence: str = "0.00"
    evidence: str | None = None


class TitleSection(BaseModel):
    user_name: str = ""
    two_word_summary: str = ""
    confidence_overall: str = "0.00"


class Demographics(BaseModel):
    age_range: ConfidenceField = ConfidenceField()
    gender: ConfidenceField = ConfidenceField()
    nationality_background: ConfidenceField = ConfidenceField()
    location: ConfidenceField = ConfidenceField()
    living_situation: ConfidenceField = ConfidenceField()
    occupation: ConfidenceField = ConfidenceField()
    education: ConfidenceField = ConfidenceField()


class Psychographics(BaseModel):
    goals_and_motivations: ConfidenceField = ConfidenceField()
    interests: ConfidenceField = ConfidenceField()
    values: ConfidenceField = ConfidenceField()


class ShoppingBehavior(BaseModel):
    frequency_of_use: ConfidenceField = ConfidenceField()
    where_used_devices: ConfidenceField = ConfidenceField()
    search_style_best_vs_first: ConfidenceField = ConfidenceField()
    price_preference_cheapest_vs_expensive: ConfidenceField = ConfidenceField()
    decision_factors: ConfidenceField = ConfidenceField()
    preferred_categories: ConfidenceField = ConfidenceField()
    pain_points_and_or_challenges: ConfidenceField = ConfidenceField()


class UserProfile(BaseModel):
    """Complete user profile structure for LLM extraction."""
    title: TitleSection = TitleSection()
    demographics: Demographics = Demographics()
    psychographics: Psychographics = Psychographics()
    shopping_behavior: ShoppingBehavior = ShoppingBehavior()
