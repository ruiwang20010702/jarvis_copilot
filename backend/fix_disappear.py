"""
修复 disappear 单词的拆分错误
将 ["dis", "a", "pear"] 改为 ["dis", "appear"]
"""
import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def fix_disappear():
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import text
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL 未设置")
        return
    
    # 确保使用异步驱动
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. 先查看当前 disappear 的数据
        result = await session.execute(
            text("SELECT id, word, syllables FROM vocab_cards WHERE word = 'disappear'")
        )
        rows = result.fetchall()
        
        print("📋 当前 disappear 记录:")
        for row in rows:
            print(f"   ID: {row[0]}, syllables: {row[2]}")
        
        # 2. 更新为正确的拆分
        correct_syllables = json.dumps(["dis", "appear"])
        
        await session.execute(
            text("UPDATE vocab_cards SET syllables = :syllables WHERE word = 'disappear'"),
            {"syllables": correct_syllables}
        )
        await session.commit()
        
        # 3. 验证更新结果
        result = await session.execute(
            text("SELECT id, word, syllables FROM vocab_cards WHERE word = 'disappear'")
        )
        rows = result.fetchall()
        
        print("\n✅ 更新后 disappear 记录:")
        for row in rows:
            print(f"   ID: {row[0]}, syllables: {row[2]}")
        
        print("\n🎉 修复完成！disappear 现在正确拆分为 dis + appear")

if __name__ == "__main__":
    asyncio.run(fix_disappear())
