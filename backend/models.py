from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

# --- Reused Models from Project 1 ---

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text, nullable=False)
    # ... other fields omitted for brevity if not strictly needed for querying, 
    # but best to include all to avoid SQLAlchemy warnings if we update
    content_hash = Column(String, index=True)
    word_count = Column(Integer)
    genre = Column(String)
    specific_topic = Column(String)
    grading_data = Column(JSON)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)

    versions = relationship("Version", back_populates="article")

class Version(Base):
    __tablename__ = "versions"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"))
    level = Column(String, index=True)  # L0, L1, L2, L3
    title = Column(String)
    content = Column(Text, nullable=False)
    source = Column(String, default="AI生成")
    syllabus_coverage = Column(JSON)
    library_tags = Column(JSON)
    stages = Column(JSON)
    value_tags = Column(JSON)
    grading_data = Column(JSON)
    original_content = Column(Text)
    status = Column(String, default="draft")
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    article = relationship("Article", back_populates="versions")
    questions = relationship("Question", back_populates="version", order_by="Question.id")
    sentence_surgeries = relationship("SentenceSurgery", back_populates="version", order_by="SentenceSurgery.id")
    vocab_cards = relationship("VocabCard", back_populates="version", order_by="VocabCard.id")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("versions.id"))
    type = Column(String)
    stem = Column(Text, nullable=False)
    options = Column(JSON)
    correct_answer = Column(String)
    analysis = Column(Text)
    
    # Project 2 specific fields (added in Project 1 schema)
    ai_tutor_script = Column(JSON)
    error_tags = Column(JSON)
    trap_type = Column(String)
    related_paragraph_indices = Column(JSON)  # 相关段落索引，用于 Coaching 阶段定位原文
    
    created_at = Column(DateTime, default=datetime.utcnow)

    version = relationship("Version", back_populates="questions")

class SentenceSurgery(Base):
    __tablename__ = "sentence_surgeries"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("versions.id"))
    original_sentence = Column(Text, nullable=False)
    translation = Column(Text)
    analysis = Column(Text)
    structure_data = Column(JSON)
    
    # Project 2 specific fields
    chunks_visual = Column(JSON)
    core_sentence = Column(Text)
    core_audio_url = Column(String)
    coach_script = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    version = relationship("Version", back_populates="sentence_surgeries")

class VocabCard(Base):
    __tablename__ = "vocab_cards"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("versions.id"))
    word = Column(String, index=True)
    syllables = Column(JSON)
    phonetic = Column(String)
    definition = Column(Text)
    context_sentence = Column(Text)
    ai_memory_hint = Column(Text)
    audio_url = Column(String)
    difficulty_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    version = relationship("Version", back_populates="vocab_cards")


# --- New Models for Project 2 ---

class UserProfile(Base):
    """Student/Coach Profile"""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    role = Column(String) # student, coach
    level = Column(String, default="L0") # L0-L3
    tags = Column(JSON) # ["basketball", "science"]
    
    # Stats
    total_reading_time = Column(Integer, default=0)
    vocab_mastered_count = Column(Integer, default=0)
    surgery_completed_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class SessionLog(Base):
    """Classroom Session Logs"""
    __tablename__ = "session_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True) # UUID
    user_id = Column(Integer, ForeignKey("user_profiles.id"))
    article_id = Column(Integer, ForeignKey("articles.id"))
    version_id = Column(Integer, ForeignKey("versions.id"))
    
    # Performance Data
    reading_speed = Column(Integer) # wpm
    looked_up_words = Column(JSON) # ["word1", "word2"]
    quiz_results = Column(JSON) # [{"qId": 1, "correct": true}]
    response_rate = Column(Float) # 0.0 - 1.0
    
    created_at = Column(DateTime, default=datetime.utcnow)
