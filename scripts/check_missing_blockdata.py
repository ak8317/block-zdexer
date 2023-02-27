import psycopg2
import traceback
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_HOST = os.getenv('DB_SCRIPT_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_DATABASE = os.getenv('DB_DATABASE')

try:
    print("PostgreSQL connection is starting")
    connection = psycopg2.connect(user=DB_USER,
                                  password=DB_PASS,
                                  host=DB_HOST,
                                  port=DB_PORT,
                                  database=DB_DATABASE)
    cursor = connection.cursor()
    postgreSQL_select_Query = "select id::INTEGER from app.block_entities order by id;"

    cursor.execute(postgreSQL_select_Query)
    block_records = cursor.fetchall()

    count = 0
    for row in block_records:

        if count != row[0]:
            print("missing block========", count)
            count = row[0] + 1
        else:
            count += 1

except (Exception, psycopg2.Error) as error:
    print("Error while fetching data from PostgreSQL", error, traceback.format_exc())

finally:
    # closing database connection.
    if connection:
        cursor.close()
        connection.close()
        print("PostgreSQL connection is closed")
